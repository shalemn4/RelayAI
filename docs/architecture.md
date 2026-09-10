# RelayAI Architecture & System Design

## 1. Executive Overview

RelayAI is an AI-powered business communication and customer engagement platform engineered for operations, sales, and customer support teams. The system aggregates customer interactions across multiple channels (SMS, WhatsApp, Email, WebChat), orchestrates automated AI replies with confidence scoring and human-in-the-loop oversight, provides a SQL-style visual filter builder, handles real-time synchronization over WebSockets, and offers offline mutation queues.

This document details the architectural boundaries, state management philosophy, data contracts, and client-server synchronization protocols.

---

## 2. System Topology

```
                                  +-------------------------------------------------------+
                                  |                     RelayAI Client                    |
                                  |              (React Native / Expo Router)             |
                                  +-------------------------------------------------------+
                                        |                   |                   |
                           HTTPS REST   |        WebSocket  |        Offline    |
                           (Axios)      |        (WSS Hub)  |        Queue      |
                                        v                   v                   v
+---------------------------------------------------------------------------------------------------+
|                                       FastAPI Backend Service                                     |
|                                                                                                   |
|  +---------------------+   +---------------------+   +---------------------+   +----------------+ |
|  | Authentication &    |   | Inbox & Messaging   |   | AI Orchestration    |   | SQL AST Filter | |
|  | JWT Guard (Access/  |   | (Pagination, CRUD,  |   | (Streaming, Tool-   |   | Compiler       | |
|  | Refresh Flow)       |   | Status Lifecycle)   |   | Calling, Mock/Live) |   | (Safe Parser)  | |
|  +---------------------+   +---------------------+   +---------------------+   +----------------+ |
|            |                         |                         |                       |          |
|            +-------------------------+------------+------------+-----------------------+          |
|                                                   |                                               |
|                                                   v                                               |
|                                  +---------------------------------+                              |
|                                  |   SQLAlchemy 2.0 Async ORM      |                              |
|                                  |  (PostgreSQL / SQLite WAL Mode) |                              |
|                                  +---------------------------------+                              |
|                                                   |                                               |
|                                                   v                                               |
|                                  +---------------------------------+                              |
|                                  |   Relational Database Storage   |                              |
|                                  +---------------------------------+                              |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. State Management Architecture

A fundamental principle in RelayAI is the strict distinction between **Server State**, **Client/UI State**, **Persisted State**, and **Transient Real-time State**.

### 3.1 State Matrix

| Type | Technology | Scope | Examples |
| :--- | :--- | :--- | :--- |
| **Server State** | TanStack Query v5 | Remote data cached from REST API | Conversations, messages, leads, calls, saved filters, analytics metrics |
| **Client UI State** | Zustand | Local transient component interaction state | Filter builder staging AST, message composer text draft, active modals/sheets, takeover confirmation dialogs |
| **Persisted State** | SecureStore Abstraction | Local device credentials | Auth JWT tokens, operator preferences, theme selection |
| **Offline Queue** | Zustand + LocalStorage | Pending mutations awaiting connection | Unsent messages with temporary UUIDs, optimistic stage changes |
| **Real-time Stream** | Central RealtimeManager | Ephemeral live event feed | Token-by-token AI streaming, voice call transcript utterances, typing indicators |

### 3.2 Why Not Zustand For Everything?
TanStack Query provides deterministic caching, automatic garbage collection, background refetch on window/app focus, request deduplication, pagination/infinite query management, and standardized mutation rollbacks. Storing server payloads in Zustand creates stale state bugs, duplicate caching logic, and excessive boilerplate.

---

## 4. Real-time Architecture

```
[Mobile / Web Client]
        |
        | 1. Connect ws://host/ws?token=<jwt>
        v
[FastAPI WebSocket Hub] ---> [ConnectionManager]
        |                          |
        | 2. Client subscribes     |-- Tracks active sockets per user & topic
        |    { action: "subscribe", topic: "conversation:101" }
        |
        |<-- 3. Broadcasts event
        |    { type: "message.created", payload: {...} }
        v
[Client RealtimeManager]
        |
        +---> Invalidate or append to TanStack Query cache:
              queryClient.setQueryData(['conversation', id, 'messages'], ...)
```

### Key Real-time Guarantees:
1. **Single Connection**: Only one WebSocket connection is maintained per app session.
2. **Topic Subscription**: Screens register/unregister topics (e.g., `conversation:42`, `call:12`) upon mount/unmount.
3. **Reconnection with Backoff**: Automatic exponential backoff reconnection with jitter (1s to 30s).
4. **Cache Reconciliation**: Upon reconnection, TanStack Query triggers `invalidateQueries()` to fetch missed events during the disconnect window.

---

## 5. SQL-Style Filter AST Architecture

To prevent dangerous raw SQL generation while giving operators powerful multi-condition filtering, RelayAI uses an **Abstract Syntax Tree (AST)** representation:

```json
{
  "operator": "AND",
  "conditions": [
    {
      "field": "lead_status",
      "operator": "eq",
      "value": "qualified"
    },
    {
      "field": "channel",
      "operator": "in",
      "value": ["sms", "whatsapp"]
    },
    {
      "operator": "OR",
      "conditions": [
        {
          "field": "sentiment",
          "operator": "eq",
          "value": "positive"
        },
        {
          "field": "priority",
          "operator": "eq",
          "value": "urgent"
        }
      ]
    }
  ]
}
```

The backend `FilterCompiler` validates fields against a strict schema whitelist and translates the tree into parameterized SQLAlchemy binary expressions. No raw SQL strings are ever constructed.

---

## 6. Offline-First Resilience Strategy

```
[User taps Send]
        |
        v
[Check Network Status]
   |                |
   | (Online)       | (Offline)
   v                v
[Post via Axios]  [Write to Offline Queue (Zustand)]
   |                | -> Render Bubble: "Waiting to send" (Yellow clock icon)
   | (Success)      |
   v                | [Network Reconnected]
[Reconcile Cache]   v
                  [Process Queue Sequentially]
                    | -> Status: "Sending..." (Spinner)
                    | -> Status: "Sent" (Double checkmark)
                    | -> Or "Failed" (Retry button on error)
```

---

## 7. Product Analytics Layer

All analytics events follow a strict zero-PII specification. Events track user workflows, AI efficacy, and operational velocity without transmitting sensitive message content, customer emails, or phone numbers.

Example event:
```json
{
  "event": "ai_suggestion_accepted",
  "properties": {
    "conversation_id": 42,
    "channel": "sms",
    "lead_stage": "qualified",
    "confidence": 0.94,
    "edited": false,
    "time_to_action_ms": 3200
  }
}
```
An analytics abstraction interface (`AnalyticsProvider`) routes events to PostHog in production or to a structured local logger during development.

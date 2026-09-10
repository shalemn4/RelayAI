# RelayAI — AI Communication Operations Platform

RelayAI is a production-quality AI-powered business communication and customer engagement platform built for operations, customer support, and sales teams. It unifies customer interactions across SMS, WhatsApp, Email, and WebChat, orchestrates autonomous AI replies with confidence scoring and human-in-the-loop oversight, provides a visual SQL-style compound filter builder, and delivers data-driven operational analytics with offline resilience.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  RelayAI Platform                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +------------------------------------+    +---------------------------------+   |
|   |         React Native / Expo        |    |         FastAPI Backend         |   |
|   |            (apps/mobile)           |    |            (backend/)           |   |
|   |------------------------------------|    |---------------------------------|   |
|   | • Expo Router (Typed Navigation)   |    | • FastAPI REST Endpoints        |   |
|   | • TanStack Query v5 (Server State) |<-->| • WebSocket Realtime Hub        |   |
|   | • Zustand (UI/Local State)         |    | • SQLAlchemy 2.0 Async Models   |   |
|   | • Reusable Design System Primitives|    | • SQLite / PostgreSQL Engine    |   |
|   | • Visual SQL-AST Filter Builder    |    | • AI Provider & Tool-Calling    |   |
|   | • Offline Mutation Queue           |    | • Live Call Telemetry Stream    |   |
|   | • Sanitized Zero-PII Analytics     |    | • AST-to-SQL Query Compiler     |   |
|   +------------------------------------+    +---------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## Key Engineering Challenges & Solutions

### 1. Server State vs. Client UI State (Strict Separation)
- **TanStack Query v5**: Owns all asynchronous remote data (conversations, messages, leads, calls, analytics, saved filters). Handles automatic garbage collection, background focus revalidation, and optimistic rollback.
- **Zustand**: Strictly reserved for ephemeral client UI state (filter builder staging AST, composer drafts, modal states, network status, and offline queue items). Prevents duplicate caching bugs.

### 2. SQL-Style Visual Filter Builder (Typed AST)
- Operators can visually build nested boolean expressions (e.g. `(channel == 'sms' AND lead_status == 'qualified') OR sentiment == 'negative'`).
- The frontend manipulates an immutable **Filter AST** (`FilterGroup` and `FilterCondition`).
- The backend `FilterCompiler` safely maps the AST into parameterized SQLAlchemy binary expressions with an explicit field whitelist—**100% immune to SQL injection**.

### 3. Human-in-the-Loop (HITL) AI Suggestions & Takeover
- Every customer inquiry generates an AI suggested reply with **confidence telemetry** (e.g., `94% High Confidence`), category classification, and step-by-step reasoning traces.
- Operators can one-tap `Accept` (optimistically dispatches reply), `Edit` (loads into composer), `Regenerate`, or `Reject`.
- A dedicated takeover toggle allows immediate handoff between `AI Active` and `Human Assigned`.

### 4. Genuinely Data-Driven Analytics
- **Zero hardcoded numbers**. All metrics on the Analytics Dashboard (AI acceptance rate, median response latency, human takeover rate, conversion volume, period deltas `+8.4%`) are computed dynamically via SQL aggregation queries on actual database interaction events.
- Telemetry events are intercepted by a zero-PII sanitizer that strips customer message text, phone numbers, and emails.

### 5. Resilient Offline Mutation Queue
- When connectivity drops, outgoing messages transition to `waiting_to_send` and are safely stored in local state.
- Upon reconnecting, the queue manager flushes messages sequentially to the API, updating status to `sending` then `sent`.

---

## How to Run RelayAI

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node v22)
- npm 10+

---

### Step 1: Start the Backend Service

In your terminal:
```bash
# 1. Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# 2. Seed database with 30 customers, 50+ conversations, 120+ messages, 20 leads, 15 calls, and 150+ analytics events
python -m backend.app.db.seed

# 3. Start FastAPI server on port 8000
python -m uvicorn backend.app.main:app --reload --port 8000
```
> The API documentation will be live at: **http://localhost:8000/docs**

---

### Step 2: Start the Mobile & Web Client

In a second terminal:
```bash
# Navigate to mobile app directory
cd apps/mobile

# Run in Web Browser mode for immediate interactive demonstration
npx expo start --web
```
> Or to run on mobile: `npx expo start` (and scan QR code with Expo Go on iOS/Android).

---

## Demo Credentials

The database comes pre-seeded with dedicated operator accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Operator** | `operator@relayai.com` | `RelayOperator123!` |
| **Supervisor** | `supervisor@relayai.com` | `RelaySupervisor123!` |

> **Tip**: The login screen features a 1-tap **"Fill Operator (Jordan)"** button to log in instantly.

---

## Running the Automated Test Suite

### Backend Tests (Pytest)
Runs unit and integration tests for auth, the safe SQL AST filter compiler, dynamic analytics calculations, and AI suggestions:
```bash
python -m pytest tests/test_backend.py -v
```

### Frontend Architecture Tests (Jest)
Validates zero-PII analytics sanitization, Filter AST builder tree mutations, and offline queue states:
```bash
npm test
```

---

## 5-Minute Portfolio Demo Flow

1. **Sign In**: Tap **"Fill Operator (Jordan)"** and sign in.
2. **Unified Inbox**:
   - Notice the rich list of cross-channel conversations (SMS, WhatsApp, Email, WebChat).
   - Use search to filter by customer name or company.
   - Tap quick filter chips: `Unread`, `AI Active`, `SMS`, `WhatsApp`.
3. **Conversation & HITL AI Suggestions**:
   - Open a conversation (e.g. *Apex Logistics* or *Hyperion Labs*).
   - Inspect the **AI Suggested Response** card showing `94% High Confidence`, category, and reasoning trace.
   - Tap **"Send"** to accept the suggestion: observe immediate optimistic dispatch in chat and message status transition to `delivered`.
4. **Human Takeover**:
   - Tap **"Take Over"** in the banner: status updates immediately to `Human Assigned` and AI auto-response pauses.
   - Type a custom response in the composer and send it.
   - Tap **"Return to AI"** to hand conversation back to autonomous mode.
5. **Visual SQL Filter Builder**:
   - Return to the inbox and tap **"Filter (SQL)"**.
   - Build a compound query: `Channel == 'sms'` AND `Lead Stage == 'qualified'`.
   - Tap **"Apply Filter"**: observe inbox list filter down to matched conversations.
6. **Data-Driven Analytics**:
   - Navigate to the **Analytics** tab.
   - Observe real computed metrics: Conversations Handled, AI Reply Acceptance Rate, Avg Response Time, and period deltas.
   - Tap **"Record AI Acceptance Event"** at the bottom to watch the live rate recalculate dynamically from the database.
7. **Voice AI Transcripts**:
   - Navigate to the **Voice AI** tab.
   - Open an active call: observe simulated audio waveform, transcript utterances arriving over WebSockets, and trigger **"Take Over Call"**.
8. **Offline Resilience**:
   - Toggle offline mode or disconnect: draft a reply in the composer and notice the bubble displays `⏳ Waiting to send`.
   - Restore connection: watch the queue flush and message transition to `✓ Delivered`.

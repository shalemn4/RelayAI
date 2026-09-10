# ERD 001: Unified Inbox & Real-Time Conversation Management

## 1. Problem
Support and operations operators juggle fragmented customer conversations across SMS, WhatsApp, Email, and WebChat. Without a unified feed, incoming inquiries are missed, AI triage status is opaque, and response times degrade.

## 2. Goal
Provide a unified, high-density, real-time inbox interface that aggregates cross-channel interactions, displays live AI/human ownership, supports cursor-based infinite pagination, search, quick filtering, and zero-latency conversation transitions.

## 3. User Stories
- As an operator, I want to see all incoming conversations in one list sorted by latest activity so that I can prioritize urgent customer requests.
- As an operator, I want to quickly distinguish between conversations handled autonomously by AI versus those requiring human intervention.
- As an operator, I want to filter the inbox by unread status, assigned to me, and sentiment so that I can manage my queue efficiently.

## 4. Functional Requirements
- **Channel Indicators**: Distinct visual badges for SMS, WhatsApp, Email, WebChat.
- **State Indicators**: `ai_active`, `human_assigned`, `escalated`, `resolved`.
- **Snippet & Metadata**: Last message preview, relative timestamp, unread counter badge, customer company name, priority flag.
- **Search & Quick Filters**: Debounced text search (customer name, snippet), filter chips for `All`, `Unread`, `Assigned to Me`, `AI Active`, `Escalated`.
- **Infinite Pagination**: Virtualized FlatList with cursor/page-based infinite query (`useInfiniteQuery`).
- **Real-time Updates**: Real-time insertion of new conversations and reordering when new messages arrive via WebSocket.

## 5. Non-Functional Requirements
- List scroll performance must maintain 60fps on mobile devices with 500+ loaded conversations.
- First render time < 250ms with cached data.
- Accessible touch targets >= 44x44pt.

## 6. Technical Approach
- **Server State**: `useInfiniteQuery({ queryKey: ['conversations', filters], queryFn: fetchConversations })`.
- **UI Virtualization**: React Native `FlatList` with `initialNumToRender={12}`, `maxToRenderPerBatch={10}`, `windowSize={5}`.
- **Real-time Sync**: On `conversation.updated` or `message.created` WebSocket event, update cache using `queryClient.setQueryData`.

## 7. API Requirements
- `GET /api/v1/conversations`:
  - Query params: `cursor`, `limit`, `search`, `channel`, `status`, `assigned_to`, `filter_id`.
  - Response: `{ items: Conversation[], next_cursor: string | null, total: number }`

## 8. Analytics Events
- `conversation_opened`: `{ conversation_id, channel, status, sentiment }`
- `inbox_search_performed`: `{ query_length, results_count }`
- `inbox_filter_changed`: `{ filter_type }`

## 9. Testing Strategy
- Unit test: Pagination cursor reducer and cache reconciliation.
- Component test: `ConversationList` empty state, skeleton loading state, unread badge rendering.
- E2E test: Open inbox, tap conversation, verify navigation and metadata rendering.

## 10. Success Metrics
- Average Time to First Open (TTFO) < 300ms.
- 99% of new incoming messages reflected in the UI within 1 second of receipt.

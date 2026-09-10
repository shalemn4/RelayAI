# ERD 002: AI Reply Suggestions & Human-in-the-Loop Workflow

## 1. Problem
Operators spend excessive time drafting repetitive responses to routine customer inquiries (pricing, demos, scheduling, troubleshooting). Conversely, fully autonomous AI can occasionally hallucinate or make commitments without operator verification.

## 2. Goal
Provide a seamless **Human-in-the-Loop (HITL)** AI reply suggestion experience. The operator reviews suggestions generated with visible confidence metrics and reasoning steps, and can one-tap `Accept` (optimistically sends), `Edit` (loads into composer), `Regenerate`, or `Reject`.

## 3. User Stories
- As an operator, I want to see an AI-suggested response as soon as a customer message arrives so I can respond with one tap.
- As an operator, I want to inspect the AI's confidence score and underlying reasoning steps before approving the message.
- As an operator, I want to quickly edit the AI suggestion in my message composer when minor adjustments are needed.
- As an operator, I want to take over the conversation completely when complex or sensitive human empathy is required.

## 4. Functional Requirements
- **Suggestion Lifecycle States**: `idle`, `generating`, `ready`, `accepted`, `rejected`, `failed`, `expired`.
- **Telemetry Display**: Confidence score (e.g. `94% High Confidence`), reasoning category (e.g. `Product Inquiry / Tier Matrix`), source references.
- **Streaming Response**: Progressive token rendering as the AI generates the text over WebSocket or chunked HTTP.
- **Actions**:
  - `Accept`: Immediately sends the suggested text via optimistic mutation, records analytics, closes suggestion card.
  - `Edit`: Copies suggestion into message composer text input, focuses input, allows manual tweak.
  - `Regenerate`: Requests an alternative draft with adjusted temperature.
  - `Reject`: Dismisses suggestion with optional feedback reason.
- **Human Takeover Switch**: Dedicated header/banner button allowing one-tap switch between `AI Active` and `Human Assigned`.

## 5. Non-Functional Requirements
- Token streaming rendering must maintain smooth text updates without layout jank or scroll jumping.
- Optimistic message dispatch latency must be < 16ms (1 frame).

## 6. Technical Approach
- **Server State**: `useQuery({ queryKey: ['ai-suggestion', conversationId] })` for current suggestion.
- **Optimistic Mutation**: `useMutation({ mutationFn: sendMessage, onMutate: ... })` updates TanStack Query message cache with temporary client UUID.
- **Realtime**: WebSocket event `ai.generation.chunk` appends to streaming buffer in local state.

## 7. API Requirements
- `POST /api/v1/conversations/{id}/ai-suggestion`: Request manual generation.
- `POST /api/v1/conversations/{id}/ai-suggestion/feedback`: Submit `{ action: 'accept'|'reject'|'edit', original_text, final_text }`.
- `POST /api/v1/conversations/{id}/takeover`: Toggle operator assignment.

## 8. Analytics Events
- `ai_suggestion_generated`: `{ conversation_id, confidence, category }`
- `ai_suggestion_accepted`: `{ conversation_id, confidence, edited: false }`
- `ai_suggestion_edited`: `{ conversation_id, diff_ratio }`
- `ai_suggestion_rejected`: `{ conversation_id, reason }`
- `human_takeover`: `{ conversation_id, previous_state }`

## 9. Testing Strategy
- Unit test: Confidence formatting, diff calculations, optimistic cache update.
- Component test: `AISuggestionCard` state transitions (`generating` -> `ready` -> `accepted`).
- E2E test: Open conversation -> wait for AI suggestion -> click Accept -> verify message appears in history and server reconciles.

## 10. Success Metrics
- AI Suggestion Acceptance Rate >= 70%.
- Average response time reduced from 3.5 minutes to < 30 seconds.

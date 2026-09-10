# ERD 005: Product & Operational Analytics Dashboard

## 1. Problem
Static dashboards that display hardcoded numbers fail to demonstrate real frontend data handling, dynamic aggregation, time-series transformations, or genuine business insights. Operators and product managers need to monitor real operational velocity (AI acceptance rate, response latency, takeover frequency, channel distribution) derived from actual underlying interaction logs and events.

## 2. Goal
Provide a data-driven, interactive analytics dashboard that computes KPIs and charts dynamically from underlying database interaction logs and telemetry events (conversations, messages, AI suggestion outcomes, call durations). Supports time range filtering (24h, 7d, 30d), channel breakdown, and comparative delta calculations against previous periods.

## 3. User Stories
- As an operations manager, I want to see the real AI reply acceptance rate (% of generated suggestions accepted vs rejected or edited) computed from actual events.
- As an operations manager, I want to track median human response time and AI response time across channels.
- As a team lead, I want to filter metrics by time period (Today, Last 7 Days, Last 30 Days) and see percentage changes compared to the prior window.
- As an engineering reviewer, I want to see that analytics cards are truly reactive: sending an AI suggestion or taking over a conversation updates the backend event log and immediately reflects in refreshed analytics queries.

## 4. Functional Requirements
- **Key Metrics (Computed from DB events)**:
  - `Conversations Handled`: Total active and resolved conversations in the timeframe.
  - `AI Reply Acceptance Rate`: `accepted_count / total_suggestions_generated * 100`.
  - `Average Response Time`: Median time (in seconds) between customer message and subsequent agent/human reply.
  - `Human Takeover Rate`: `takeover_events / total_ai_conversations * 100`.
  - `Lead Stage Conversions`: Count of leads progressing to `demo` or `won`.
  - `Calls Completed`: Audio call volume and average duration.
- **Comparative Trends**: Dynamic calculation of delta (`+8.4% vs previous period`) computed by querying the equivalent preceding time range.
- **Visual Visualizations**:
  - Time-series volume chart (daily/hourly volume breakdown).
  - Channel distribution breakdown (SMS, WhatsApp, Email, WebChat).
  - AI vs Human resolution ratio.
- **Filters**: Date range selector (`24h`, `7d`, `30d`), Channel selector, Agent filter.

## 5. Non-Functional Requirements
- Aggregation query response latency < 120ms on backend SQLite/PostgreSQL.
- Frontend chart rendering without blocking UI thread; graceful skeleton loader while fetching.

## 6. Technical Approach
- **Backend Dynamic Aggregation**:
  - FastAPI `/api/v1/analytics/overview` endpoint executes SQL aggregations (`COUNT`, `AVG`, `GROUP BY`) over the `analytics_events` and `conversations` tables for both current and comparison periods.
- **Server State**:
  - TanStack Query `useQuery({ queryKey: ['analytics', { period, channel, agentId }] })` with 60s stale time.
  - Invalidation hook: After accepting an AI suggestion or taking over, `queryClient.invalidateQueries({ queryKey: ['analytics'] })` updates metrics dynamically.

## 7. API Requirements
- `GET /api/v1/analytics/overview`:
  - Query parameters: `period` ('24h' | '7d' | '30d'), `channel` (optional), `agent_id` (optional).
  - Response:
    ```json
    {
      "period": "7d",
      "summary": {
        "conversations_count": 142,
        "conversations_delta": 12.5,
        "ai_acceptance_rate": 74.2,
        "ai_acceptance_delta": 6.8,
        "avg_response_time_seconds": 28.4,
        "avg_response_time_delta": -14.2,
        "human_takeover_rate": 11.3,
        "human_takeover_delta": -3.1
      },
      "channel_breakdown": [
        { "channel": "sms", "count": 64, "percentage": 45.1 },
        { "channel": "whatsapp", "count": 48, "percentage": 33.8 },
        { "channel": "email", "count": 18, "percentage": 12.7 },
        { "channel": "webchat", "count": 12, "percentage": 8.4 }
      ],
      "daily_trends": [
        { "date": "2026-09-04", "ai_replies": 32, "human_replies": 10 },
        { "date": "2026-09-05", "ai_replies": 41, "human_replies": 8 }
      ]
    }
    ```

## 8. Testing Strategy
- Unit test: Backend SQL aggregation functions calculating rate percentages and period deltas correctly.
- Component test: `MetricCard` rendering positive/negative delta badges and formatters.
- Integration test: Triggering an `ai_suggestion_accepted` event alters the acceptance rate on subsequent query fetch.

## 9. Success Metrics
- 100% of dashboard metrics derived dynamically from database records.
- Zero hardcoded mock numbers in the analytics visualization layer.

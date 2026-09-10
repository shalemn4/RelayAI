# ADR 0002: Centralized WebSocket Event Architecture

## Context
Real-time events (incoming customer messages, AI generation chunks, live call transcripts, agent status changes) arrive asynchronously. Opening separate WebSocket connections inside individual screens or components leads to socket resource exhaustion, missed background events, reconnect thrashing, and component unmount memory leaks.

## Decision
We implement a single **Centralized RealtimeManager** singleton at the application root:
1. One persistent authenticated WebSocket connection per client session.
2. Publish-subscribe topic registry: components call `realtimeManager.subscribe(topic, handler)` and `unsubscribe(topic, handler)`.
3. Event routing connects incoming events directly to TanStack Query's cache (`queryClient.setQueryData` / `queryClient.invalidateQueries`).
4. Automated reconnect with exponential backoff and jitter.

## Consequences
- **Positive**: Low memory overhead, robust reconnection handling, unified authentication handshake, and predictable lifecycle cleanup.
- **Negative**: Topic routing logic must be cleanly structured so components only receive events they care about.

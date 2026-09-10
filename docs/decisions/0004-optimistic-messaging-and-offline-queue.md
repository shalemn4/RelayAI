# ADR 0004: Optimistic Messaging and Resilient Offline Queue

## Context
Operators working in business messaging environments expect immediate UI responsiveness when sending replies, even during transient network disconnects or elevator/subway rides. Dropping messages or blocking the UI with full-screen spinners frustrates users and reduces communication velocity.

## Decision
1. **Optimistic Mutations**: When an operator sends a message, a temporary client UUID message object is immediately appended to the TanStack Query message cache with state `sending`.
2. **Offline Mutation Queue**: If the network is unavailable (`isOnline === false`), the message is placed in a persistent offline queue in Zustand with status `waiting_to_send`.
3. **Reconciliation**: When online status is restored, the queue worker flushes items sequentially. On server acceptance (201 Created), the temporary UUID is swapped for the server ID and status becomes `sent`. If the request fails, the item moves to `failed` and exposes a one-tap `Retry` button.

## Consequences
- **Positive**: Zero perceivable latency for operators; guarantees zero dropped messages across spotty connections; clear visual states (`waiting_to_send` -> `sending` -> `sent` / `failed`).
- **Negative**: Temporary IDs require careful handling in message list key extractors to prevent flickering upon ID swap.

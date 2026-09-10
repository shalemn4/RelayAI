# ADR 0001: TanStack Query and Zustand State Partitioning

## Context
In complex multi-channel communication applications, developers frequently combine server-cached data and client UI state into a single global store (e.g. Redux or Zustand). In practice, this causes state synchronization bugs, stale cached data, manual re-fetching boilerplate, and complex rollback code on network failures.

## Decision
We partition state strictly into two domains:
1. **Server State (TanStack Query v5)**: Remote data fetched from the REST API (conversations, messages, leads, calls, analytics, saved filters). Handled via query keys, stale-time policies, cache garbage collection, and optimistic mutation rollbacks.
2. **Client UI State (Zustand)**: Ephemeral interface state that does not live on the backend (e.g. composer drafts, modal toggles, staging AST in the filter builder, offline queue items, and network status).

## Consequences
- **Positive**: Eliminates manual caching logic, automatic background revalidation on focus, standardized loading/error states, transparent deduplication of simultaneous requests.
- **Negative**: Developers must maintain discipline not to copy server state into Zustand stores unless creating an explicit draft copy for editing.

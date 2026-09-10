# ADR 0005: Sanitized Product Analytics Abstraction

## Context
Product analytics are essential to evaluate AI reply acceptance rates, response velocity, and human takeover frequency. However, business communication platforms handle Personally Identifiable Information (PII) such as customer phone numbers, credit cards, emails, and message text. Accidentally leaking PII to third-party telemetry tools violates GDPR/CCPA.

## Decision
1. **Zero-PII Specification**: Only metadata, category enums, numerical latencies, and outcome booleans are allowed in analytics payloads.
2. **Payload Sanitizer Middleware**: An automated sanitizer intercepts events before dispatch, stripping strings exceeding 64 characters and redacting sensitive keys (`body`, `text`, `email`, `phone`).
3. **Provider Abstraction**: An `AnalyticsService` interface decouples product code from the underlying tracking vendor (PostHog, Segment, or DevelopmentLogger).

## Consequences
- **Positive**: Compliant by design; facilitates measuring real operational metrics (e.g. AI acceptance %); swap analytics vendors without modifying UI components.
- **Negative**: Developers cannot inspect raw message content in analytics dashboards and must correlate issues via anonymous IDs.

# ADR 0003: Typed Abstract Syntax Tree (AST) for Dynamic Filtering

## Context
Operators need to build compound search queries across conversations (e.g. `(channel == 'sms' AND lead_status == 'hot') OR (sentiment == 'negative')`). Common anti-patterns include passing raw SQL strings from the frontend (security vulnerability) or relying on simple key-value query parameters that cannot represent boolean operator precedence or nested groups.

## Decision
We define a strongly typed `FilterAST` contract shared between client and server:
- **Condition**: `{ field: string, operator: 'eq'|'neq'|'contains'|'in'|'gt'|'lt', value: any }`
- **FilterGroup**: `{ operator: 'AND' | 'OR', conditions: (Condition | FilterGroup)[] }`

On the backend, a deterministic `FilterCompiler` validates fields and values against a whitelist and compiles the AST into parameterized SQLAlchemy binary expressions.

## Consequences
- **Positive**: 100% immune to SQL injection; supports arbitrarily deep nesting; serializable to JSON for bookmarking/saving; clean UI tree representation in React Native.
- **Negative**: Requires AST parser and tree-walker components on both frontend and backend.

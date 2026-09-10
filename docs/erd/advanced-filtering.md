# ERD 003: Advanced SQL-Style Conversation Filtering

## 1. Problem
Standard hardcoded filter chips (e.g. "Unread", "Mine") fail to support complex business segmentation (e.g. "Find high-value qualified leads on WhatsApp who sent negative sentiment messages in the last 48 hours"). Passing unchecked query parameters or raw SQL is either too limiting or a severe security risk.

## 2. Goal
Build a visual, SQL-style compound filter builder interface powered by a strongly typed **Filter Abstract Syntax Tree (AST)**. Operators can construct nested `AND`/`OR` condition groups, select fields, operators, and dynamic values, validate syntax, save named filter presets, and apply them across the unified inbox with instant URL/state reflection.

## 3. User Stories
- As an operator, I want to create multi-criteria filters with boolean logic (AND/OR) to pinpoint high-priority conversations.
- As an operator, I want to group conditions into nested blocks so I can control operator precedence.
- As an operator, I want to save complex filters with custom names so my team can reuse them.
- As an operator, I want real-time syntax validation so I cannot apply broken or incomplete filter trees.

## 4. Functional Requirements
- **AST Node Model**:
  - `Condition`: `{ id: string, field: string, operator: string, value: any }`
  - `FilterGroup`: `{ id: string, operator: 'AND' | 'OR', conditions: (Condition | FilterGroup)[] }`
- **Supported Fields**: `channel`, `lead_status`, `sentiment`, `priority`, `assigned_agent_id`, `created_at`, `unread`.
- **Supported Operators**: `eq` (equals), `neq` (not equals), `contains`, `in` (multiselect), `gt`, `lt`, `between`.
- **Dynamic Control Inputs**: Field type dictates value input (dropdown for enums, date-picker for timestamps, text input for search, multi-chips for tags).
- **Validation Rules**:
  - Every condition must have a selected field, operator, and non-empty value.
  - Groups cannot be empty.
  - Max nesting depth: 3 levels.
- **Save & Manage**:
  - Save as named filter (e.g. "Hot SMS Leads").
  - Rename / delete saved filters.

## 5. Non-Functional Requirements
- AST serialization/deserialization latency < 5ms.
- Backend safe SQL compilation with parameterized binary expressions (zero raw SQL).

## 6. Technical Approach
- **Frontend State**: Zustand store for staging tree modifications (`useFilterBuilderStore`).
- **Server State**: TanStack Query manages saved filters (`/api/v1/filters`).
- **Validation**: Zod schema recursive AST validator (`packages/validation`).
- **Backend Compiler**: `FilterCompiler` translates AST into SQLAlchemy `and_(*)` and `or_(*)` expressions with field whitelist checking.

## 7. API Requirements
- `POST /api/v1/filters`: Save a new filter `{ name: string, ast: FilterAST }`.
- `GET /api/v1/filters`: List saved filters.
- `GET /api/v1/conversations?filter_ast=<json>`: Execute AST-based query.

## 8. Analytics Events
- `filter_builder_opened`
- `filter_condition_added`: `{ field, operator }`
- `filter_applied`: `{ depth, condition_count, root_operator }`
- `filter_saved`: `{ filter_id, filter_name }`

## 9. Testing Strategy
- Unit test: AST recursive parser, validator, and JSON serializer.
- Backend test: SQLAlchemy expression compiler with SQL injection defense verification.
- Component test: Visual tree rendering, adding/removing conditions, operator toggle (AND <-> OR).
- E2E test: Open filter builder -> add 2 conditions with AND -> apply -> verify filtered results.

## 10. Success Metrics
- 40%+ of daily active operators utilize custom saved filters.
- 0 SQL injection vulnerabilities or unhandled parsing exceptions.

from typing import Any, Dict, List, Union
from sqlalchemy import and_, or_, not_
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList
from backend.app.models.conversation import Conversation
from backend.app.models.customer import Customer
from backend.app.models.lead import Lead

# Whitelist of allowed fields and their column mapping
FIELD_MAP = {
    "channel": Conversation.channel,
    "status": Conversation.status,
    "sentiment": Conversation.sentiment,
    "priority": Conversation.priority,
    "assigned_agent_id": Conversation.assigned_agent_id,
    "assigned_user_id": Conversation.assigned_user_id,
    "unread_count": Conversation.unread_count,
    "last_activity_at": Conversation.last_activity_at,
    "customer_name": Customer.name,
    "customer_company": Customer.company,
    "customer_email": Customer.email,
    "lead_status": Lead.stage,
    "lead_score": Lead.score,
}

class FilterCompilerError(Exception):
    pass

class FilterCompiler:
    """
    Compiles a typed FilterAST (JSON/Dict) into parameterized SQLAlchemy binary expressions.
    Guarantees zero raw SQL concatenation, prevents SQL injection, and enforces whitelist.
    """

    @classmethod
    def compile_condition(cls, condition: Dict[str, Any]):
        field_name = condition.get("field")
        operator = condition.get("operator")
        value = condition.get("value")

        if not field_name or field_name not in FIELD_MAP:
            raise FilterCompilerError(f"Field '{field_name}' is not allowed in filters")

        column = FIELD_MAP[field_name]

        if operator == "eq":
            return column == value
        elif operator == "neq":
            return column != value
        elif operator == "contains":
            return column.ilike(f"%{value}%")
        elif operator == "in":
            if not isinstance(value, (list, tuple)):
                value = [value]
            return column.in_(value)
        elif operator == "gt":
            return column > value
        elif operator == "lt":
            return column < value
        elif operator == "between":
            if isinstance(value, (list, tuple)) and len(value) == 2:
                return column.between(value[0], value[1])
            raise FilterCompilerError("Operator 'between' requires a 2-element array [min, max]")
        else:
            raise FilterCompilerError(f"Unsupported operator '{operator}'")

    @classmethod
    def compile_group(cls, group: Dict[str, Any]) -> Union[BinaryExpression, BooleanClauseList]:
        operator = group.get("operator", "AND").upper()
        conditions = group.get("conditions", [])

        if not conditions:
            # Empty group matches all
            return and_()

        compiled_children = []
        for child in conditions:
            if "operator" in child and "conditions" in child:
                # Nested group
                compiled_children.append(cls.compile_group(child))
            elif "field" in child and "operator" in child:
                # Single condition
                compiled_children.append(cls.compile_condition(child))
            else:
                raise FilterCompilerError("Invalid AST node structure")

        if operator == "AND":
            return and_(*compiled_children)
        elif operator == "OR":
            return or_(*compiled_children)
        else:
            raise FilterCompilerError(f"Invalid logical operator '{operator}' (must be AND or OR)")

    @classmethod
    def compile_ast(cls, ast: Dict[str, Any]):
        if not ast:
            return and_()
        return cls.compile_group(ast)

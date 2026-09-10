from pydantic import BaseModel
from typing import List, Literal, Union, Any, Optional

FilterOperator = Literal["eq", "neq", "contains", "in", "gt", "lt", "between"]
LogicalOperator = Literal["AND", "OR"]

class FilterCondition(BaseModel):
    id: str
    field: str
    operator: FilterOperator
    value: Any

class FilterGroup(BaseModel):
    id: str
    operator: LogicalOperator
    conditions: List[Union[FilterCondition, "FilterGroup"]]

class SavedFilterCreate(BaseModel):
    name: str
    ast: FilterGroup
    is_favorite: Optional[bool] = False

class SavedFilterRead(BaseModel):
    id: int
    name: str
    ast: dict
    is_favorite: bool
    created_at: str

    class Config:
        from_attributes = True

FilterGroup.model_rebuild()

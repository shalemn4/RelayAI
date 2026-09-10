from pydantic import BaseModel
from typing import Optional, List

class LeadRead(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    company: str
    stage: str
    score: int
    deal_value: float
    source: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    last_activity_at: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class LeadStageUpdate(BaseModel):
    stage: str
    notes: Optional[str] = None

class BulkLeadStageUpdate(BaseModel):
    lead_ids: List[int]
    stage: str

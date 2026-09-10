from pydantic import BaseModel
from typing import Optional, List

class CallUtteranceRead(BaseModel):
    id: int
    call_id: int
    speaker: str
    text: str
    sentiment: Optional[str] = "neutral"
    intent: Optional[str] = None
    confidence: Optional[float] = 0.95
    timestamp: str

    class Config:
        from_attributes = True

class CallRead(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_phone: str
    status: str
    duration_seconds: int
    agent_id: int
    agent_name: str
    started_at: str
    ended_at: Optional[str] = None
    sentiment: str
    intent_summary: Optional[str] = None
    utterances: List[CallUtteranceRead] = []

    class Config:
        from_attributes = True

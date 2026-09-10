from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.app.schemas.message import MessageRead

class CustomerRead(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    company: str
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ConversationRead(BaseModel):
    id: int
    customer_id: int
    customer: CustomerRead
    channel: str
    status: str
    sentiment: str
    priority: str
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    last_message_preview: Optional[str] = None
    last_activity_at: str
    unread_count: int
    tags: List[str]
    lead_id: Optional[int] = None
    lead_stage: Optional[str] = None
    lead_score: Optional[int] = None

    class Config:
        from_attributes = True

class ConversationDetailRead(ConversationRead):
    messages: List[MessageRead] = []

class ConversationListResponse(BaseModel):
    items: List[ConversationRead]
    total: int
    next_cursor: Optional[str] = None

class AISuggestionRead(BaseModel):
    id: str
    conversation_id: int
    text: str
    confidence: float
    category: str
    reasoning_steps: List[str]
    created_at: str
    state: str = "ready"

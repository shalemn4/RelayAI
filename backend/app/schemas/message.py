from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class MessageCreate(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_role: str
    sender_name: Optional[str] = None
    content: str
    status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

    class Config:
        from_attributes = True

class AISuggestionFeedback(BaseModel):
    action: str  # accept, reject, edit, regenerate
    original_text: Optional[str] = None
    final_text: Optional[str] = None
    feedback_reason: Optional[str] = None

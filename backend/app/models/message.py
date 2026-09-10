from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender_role = Column(String(50), nullable=False)  # customer, ai, human, system
    sender_name = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(50), default="sent")  # waiting_to_send, sending, sent, delivered, failed
    metadata_payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    conversation = relationship("Conversation", back_populates="messages")

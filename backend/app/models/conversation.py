from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    channel = Column(String(50), default="sms", index=True)  # sms, whatsapp, email, webchat
    status = Column(String(50), default="ai_active", index=True)  # ai_active, human_assigned, escalated, resolved
    sentiment = Column(String(50), default="neutral", index=True)  # positive, neutral, negative
    priority = Column(String(50), default="normal", index=True)  # low, normal, high, urgent
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_activity_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    unread_count = Column(Integer, default=0)
    tags = Column(JSON, default=list)  # list of strings
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)

    customer = relationship("Customer")
    assigned_agent = relationship("Agent")
    assigned_user = relationship("User")
    lead = relationship("Lead")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at.asc()")

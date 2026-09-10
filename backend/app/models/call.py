from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.database import Base

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    status = Column(String(50), default="connecting", index=True)
    # connecting, ai_speaking, customer_speaking, processing, escalating, human_takeover, completed
    duration_seconds = Column(Integer, default=0)
    sentiment = Column(String(50), default="neutral")
    intent_summary = Column(String(500), nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime, nullable=True)

    customer = relationship("Customer")
    agent = relationship("Agent")
    utterances = relationship("CallUtterance", back_populates="call", cascade="all, delete-orphan", order_by="CallUtterance.timestamp.asc()")

class CallUtterance(Base):
    __tablename__ = "call_utterances"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False, index=True)
    speaker = Column(String(50), nullable=False)  # agent, customer
    text = Column(Text, nullable=False)
    sentiment = Column(String(50), default="neutral")
    intent = Column(String(100), nullable=True)
    confidence = Column(Float, default=0.95)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    call = relationship("Call", back_populates="utterances")

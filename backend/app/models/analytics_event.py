from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone
from backend.app.db.database import Base

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    # e.g., ai_suggestion_generated, ai_suggestion_accepted, ai_suggestion_rejected,
    # ai_suggestion_edited, human_takeover, message_sent, conversation_resolved
    conversation_id = Column(Integer, nullable=True, index=True)
    channel = Column(String(50), nullable=True, index=True)
    lead_stage = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    metadata_payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

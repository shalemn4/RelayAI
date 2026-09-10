from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
from backend.app.db.database import get_db
from backend.app.models.analytics_event import AnalyticsEvent
from backend.app.schemas.analytics import AnalyticsOverview, AnalyticsEventCreate
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    period: str = Query("7d", pattern="^(24h|7d|30d)$"),
    channel: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Computes dynamic product and operational metrics directly via SQL aggregate queries
    on actual database events and messages. Zero hardcoded numbers.
    """
    return AnalyticsService.calculate_overview(db=db, period=period, channel=channel)

@router.post("/events")
def track_event(payload: AnalyticsEventCreate, db: Session = Depends(get_db)):
    """
    Ingests a sanitized, zero-PII product event.
    """
    event = AnalyticsEvent(
        event_type=payload.event_type,
        conversation_id=payload.conversation_id,
        channel=payload.channel,
        lead_stage=payload.lead_stage,
        confidence=payload.confidence,
        response_time_ms=payload.response_time_ms,
        metadata_payload=payload.metadata_payload or {},
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    return {"status": "recorded", "event_type": payload.event_type}

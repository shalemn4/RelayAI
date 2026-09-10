from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnalyticsSummary(BaseModel):
    conversations_count: int
    conversations_delta: float
    ai_acceptance_rate: float
    ai_acceptance_delta: float
    avg_response_time_seconds: float
    avg_response_time_delta: float
    human_takeover_rate: float
    human_takeover_delta: float
    leads_converted_count: int
    leads_converted_delta: float

class ChannelBreakdown(BaseModel):
    channel: str
    count: int
    percentage: float

class DailyTrendPoint(BaseModel):
    date: str
    ai_replies: int
    human_replies: int
    conversations: int

class AnalyticsOverview(BaseModel):
    period: str  # 24h, 7d, 30d
    summary: AnalyticsSummary
    channel_breakdown: List[ChannelBreakdown]
    daily_trends: List[DailyTrendPoint]

class AnalyticsEventCreate(BaseModel):
    event_type: str
    conversation_id: Optional[int] = None
    channel: Optional[str] = None
    lead_stage: Optional[str] = None
    confidence: Optional[float] = None
    response_time_ms: Optional[int] = None
    metadata_payload: Optional[Dict[str, Any]] = None

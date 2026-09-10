from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from datetime import datetime, timezone
from typing import Optional, List
import json
import asyncio
from backend.app.db.database import get_db
from backend.app.models.conversation import Conversation
from backend.app.models.customer import Customer
from backend.app.models.lead import Lead
from backend.app.models.message import Message
from backend.app.models.analytics_event import AnalyticsEvent
from backend.app.schemas.conversation import (
    ConversationRead, ConversationDetailRead, ConversationListResponse, AISuggestionRead
)
from backend.app.schemas.message import MessageCreate, MessageRead, AISuggestionFeedback
from backend.app.services.filter_compiler import FilterCompiler
from backend.app.services.ai_service import AIService
from backend.app.realtime.connection_manager import manager

router = APIRouter(prefix="/conversations", tags=["conversations"])

def conversation_to_read(conv: Conversation) -> ConversationRead:
    last_msg = conv.messages[-1] if conv.messages else None
    return ConversationRead(
        id=conv.id,
        customer_id=conv.customer_id,
        customer=conv.customer,
        channel=conv.channel,
        status=conv.status,
        sentiment=conv.sentiment,
        priority=conv.priority,
        assigned_agent_id=conv.assigned_agent_id,
        assigned_agent_name=conv.assigned_agent.name if conv.assigned_agent else None,
        assigned_user_id=conv.assigned_user_id,
        assigned_user_name=conv.assigned_user.name if conv.assigned_user else None,
        last_message_preview=last_msg.content[:80] if last_msg else None,
        last_activity_at=conv.last_activity_at.isoformat(),
        unread_count=conv.unread_count,
        tags=conv.tags or [],
        lead_id=conv.lead_id,
        lead_stage=conv.lead.stage if conv.lead else None,
        lead_score=conv.lead.score if conv.lead else None
    )

@router.get("", response_model=ConversationListResponse)
def list_conversations(
    search: Optional[str] = None,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    filter_ast: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Conversation)
        .join(Customer, Conversation.customer_id == Customer.id)
        .outerjoin(Lead, Conversation.lead_id == Lead.id)
        .options(
            joinedload(Conversation.customer),
            joinedload(Conversation.assigned_agent),
            joinedload(Conversation.assigned_user),
            joinedload(Conversation.lead),
            joinedload(Conversation.messages)
        )
    )

    # 1. Text search
    if search:
        search_filter = or_(
            Customer.name.ilike(f"%{search}%"),
            Customer.company.ilike(f"%{search}%"),
            Customer.email.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    # 2. Simple quick filters
    if channel and channel != "all":
        query = query.filter(Conversation.channel == channel)
    if status and status != "all":
        query = query.filter(Conversation.status == status)
    if priority and priority != "all":
        query = query.filter(Conversation.priority == priority)

    # 3. Typed Filter AST (Visual SQL Filter Builder)
    if filter_ast:
        try:
            ast_dict = json.loads(filter_ast)
            ast_clause = FilterCompiler.compile_ast(ast_dict)
            query = query.filter(ast_clause)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Filter AST: {str(e)}")

    total = query.count()
    items = (
        query.order_by(desc(Conversation.last_activity_at))
        .offset(cursor)
        .limit(limit)
        .all()
    )

    next_cursor = str(cursor + limit) if (cursor + limit) < total else None
    return ConversationListResponse(
        items=[conversation_to_read(c) for c in items],
        total=total,
        next_cursor=next_cursor
    )

@router.get("/{id}", response_model=ConversationDetailRead)
def get_conversation(id: int, db: Session = Depends(get_db)):
    conv = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.customer),
            joinedload(Conversation.assigned_agent),
            joinedload(Conversation.assigned_user),
            joinedload(Conversation.lead),
            joinedload(Conversation.messages)
        )
        .filter(Conversation.id == id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv_read = conversation_to_read(conv)
    msg_reads = [
        MessageRead(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_role=m.sender_role,
            sender_name=m.sender_name,
            content=m.content,
            status=m.status,
            metadata=m.metadata_payload or {},
            created_at=m.created_at.isoformat()
        )
        for m in conv.messages
    ]

    return ConversationDetailRead(
        **conv_read.model_dump(),
        messages=msg_reads
    )

@router.post("/{id}/messages", response_model=MessageRead)
async def send_message(id: int, payload: MessageCreate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc)
    new_msg = Message(
        conversation_id=id,
        sender_role="human",
        sender_name="Jordan Hayes (Operator)",
        content=payload.content,
        status="sent",
        metadata_payload=payload.metadata or {},
        created_at=now
    )
    db.add(new_msg)
    conv.last_activity_at = now
    conv.unread_count = 0

    # Record analytics event
    event = AnalyticsEvent(
        event_type="message_sent",
        conversation_id=id,
        channel=conv.channel,
        lead_stage=conv.lead.stage if conv.lead else None,
        response_time_ms=18000,
        timestamp=now
    )
    db.add(event)
    db.commit()
    db.refresh(new_msg)

    msg_read = MessageRead(
        id=new_msg.id,
        conversation_id=new_msg.conversation_id,
        sender_role=new_msg.sender_role,
        sender_name=new_msg.sender_name,
        content=new_msg.content,
        status=new_msg.status,
        metadata=new_msg.metadata_payload or {},
        created_at=new_msg.created_at.isoformat()
    )

    # Broadcast real-time message event over WebSocket
    await manager.broadcast_to_topic(
        f"conversation:{id}",
        "message.created",
        msg_read.model_dump()
    )
    await manager.broadcast_all(
        "conversation.updated",
        {"id": id, "last_activity_at": now.isoformat()}
    )

    return msg_read

@router.post("/{id}/ai-suggestion", response_model=AISuggestionRead)
async def get_ai_suggestion(
    id: int, 
    regenerate: bool = Query(False), 
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if regenerate:
        # Provide realistic AI generation feedback latency
        await asyncio.sleep(0.35)

    last_msg = conv.messages[-1] if conv.messages else None
    suggestion = AIService.generate_suggestion(
        customer_name=conv.customer.name,
        company_name=conv.customer.company,
        last_message_content=last_msg.content if last_msg else "",
        conversation_id=id,
        regenerate=regenerate
    )

    # Record analytics event for suggestion generation
    event = AnalyticsEvent(
        event_type="ai_suggestion_regenerated" if regenerate else "ai_suggestion_generated",
        conversation_id=id,
        channel=conv.channel,
        confidence=suggestion.confidence,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()

    return suggestion

@router.post("/{id}/ai-suggestion/feedback")
async def ai_suggestion_feedback(id: int, payload: AISuggestionFeedback, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    event_map = {
        "accept": "ai_suggestion_accepted",
        "reject": "ai_suggestion_rejected",
        "edit": "ai_suggestion_edited",
        "regenerate": "ai_suggestion_regenerated"
    }
    event_type = event_map.get(payload.action, "ai_suggestion_accepted")

    now = datetime.now(timezone.utc)
    event = AnalyticsEvent(
        event_type=event_type,
        conversation_id=id,
        channel=conv.channel,
        lead_stage=conv.lead.stage if conv.lead else None,
        metadata_payload={"action": payload.action, "reason": payload.feedback_reason},
        timestamp=now
    )
    db.add(event)

    # If accepted or edited into a send, we also create the message!
    if payload.action in ["accept", "edit"] and payload.final_text:
        msg = Message(
            conversation_id=id,
            sender_role="ai" if payload.action == "accept" else "human",
            sender_name=conv.assigned_agent.name if payload.action == "accept" and conv.assigned_agent else "Jordan Hayes",
            content=payload.final_text,
            status="sent",
            metadata_payload={"confidence": 0.94, "ai_accepted": True},
            created_at=now
        )
        db.add(msg)
        conv.last_activity_at = now
        db.commit()
        db.refresh(msg)

        msg_read = MessageRead(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_role=msg.sender_role,
            sender_name=msg.sender_name,
            content=msg.content,
            status=msg.status,
            metadata=msg.metadata_payload or {},
            created_at=msg.created_at.isoformat()
        )
        await manager.broadcast_to_topic(
            f"conversation:{id}",
            "message.created",
            msg_read.model_dump()
        )
    else:
        db.commit()

    return {"status": "success", "action": payload.action}

@router.post("/{id}/takeover")
async def takeover_conversation(id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.status = "human_assigned"
    now = datetime.now(timezone.utc)
    event = AnalyticsEvent(
        event_type="human_takeover",
        conversation_id=id,
        channel=conv.channel,
        lead_stage=conv.lead.stage if conv.lead else None,
        timestamp=now
    )
    db.add(event)
    db.commit()

    await manager.broadcast_to_topic(
        f"conversation:{id}",
        "conversation.updated",
        {"id": id, "status": "human_assigned"}
    )
    return {"status": "human_assigned", "conversation_id": id}

@router.post("/{id}/return-to-ai")
async def return_to_ai(id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.status = "ai_active"
    db.commit()

    await manager.broadcast_to_topic(
        f"conversation:{id}",
        "conversation.updated",
        {"id": id, "status": "ai_active"}
    )
    return {"status": "ai_active", "conversation_id": id}

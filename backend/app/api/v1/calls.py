from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List
from backend.app.db.database import get_db
from backend.app.models.call import Call, CallUtterance
from backend.app.schemas.call import CallRead, CallUtteranceRead
from backend.app.realtime.connection_manager import manager

router = APIRouter(prefix="/calls", tags=["calls"])

def call_to_read(c: Call) -> CallRead:
    return CallRead(
        id=c.id,
        customer_id=c.customer_id,
        customer_name=c.customer.name,
        customer_phone=c.customer.phone,
        status=c.status,
        duration_seconds=c.duration_seconds,
        agent_id=c.agent_id,
        agent_name=c.agent.name,
        started_at=c.started_at.isoformat(),
        ended_at=c.ended_at.isoformat() if c.ended_at else None,
        sentiment=c.sentiment,
        intent_summary=c.intent_summary,
        utterances=[
            CallUtteranceRead(
                id=u.id,
                call_id=u.call_id,
                speaker=u.speaker,
                text=u.text,
                sentiment=u.sentiment,
                intent=u.intent,
                confidence=u.confidence,
                timestamp=u.timestamp.isoformat()
            )
            for u in c.utterances
        ]
    )

@router.get("", response_model=List[CallRead])
def list_calls(db: Session = Depends(get_db)):
    calls = (
        db.query(Call)
        .options(
            joinedload(Call.customer),
            joinedload(Call.agent),
            joinedload(Call.utterances)
        )
        .order_by(Call.started_at.desc())
        .all()
    )
    return [call_to_read(c) for c in calls]

@router.get("/{id}", response_model=CallRead)
def get_call(id: int, db: Session = Depends(get_db)):
    call = (
        db.query(Call)
        .options(
            joinedload(Call.customer),
            joinedload(Call.agent),
            joinedload(Call.utterances)
        )
        .filter(Call.id == id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call_to_read(call)

@router.post("/{id}/takeover")
async def takeover_call(id: int, db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call.status = "human_takeover"
    db.commit()

    await manager.broadcast_to_topic(
        f"call:{id}",
        "call.status.changed",
        {"id": id, "status": "human_takeover"}
    )
    return {"status": "human_takeover", "call_id": id}

@router.post("/{id}/end")
async def end_call(id: int, db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    call.status = "completed"
    call.ended_at = datetime.now(timezone.utc)
    db.commit()

    await manager.broadcast_to_topic(
        f"call:{id}",
        "call.status.changed",
        {"id": id, "status": "completed"}
    )
    return {"status": "completed", "call_id": id}

@router.post("/{id}/simulate-utterance")
async def simulate_utterance(id: int, speaker: str = "customer", text: str = "Yes, please confirm the appointment.", db: Session = Depends(get_db)):
    call = db.query(Call).filter(Call.id == id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    now = datetime.now(timezone.utc)
    utterance = CallUtterance(
        call_id=id,
        speaker=speaker,
        text=text,
        sentiment="positive" if speaker == "agent" else "neutral",
        intent="Appointment Confirmation",
        confidence=0.97,
        timestamp=now
    )
    db.add(utterance)
    call.status = "ai_speaking" if speaker == "agent" else "customer_speaking"
    db.commit()
    db.refresh(utterance)

    payload = {
        "id": utterance.id,
        "call_id": id,
        "speaker": utterance.speaker,
        "text": utterance.text,
        "sentiment": utterance.sentiment,
        "intent": utterance.intent,
        "confidence": utterance.confidence,
        "timestamp": utterance.timestamp.isoformat()
    }
    await manager.broadcast_to_topic(
        f"call:{id}",
        "call.transcript.updated",
        payload
    )
    return payload

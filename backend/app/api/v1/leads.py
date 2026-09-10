from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from datetime import datetime, timezone
from typing import Optional, List
from backend.app.db.database import get_db
from backend.app.models.lead import Lead
from backend.app.models.customer import Customer
from backend.app.models.user import User
from backend.app.schemas.lead import LeadRead, LeadStageUpdate, BulkLeadStageUpdate

router = APIRouter(prefix="/leads", tags=["leads"])

def lead_to_read(l: Lead) -> LeadRead:
    return LeadRead(
        id=l.id,
        customer_id=l.customer_id,
        customer_name=l.customer.name,
        customer_email=l.customer.email,
        customer_phone=l.customer.phone,
        company=l.customer.company,
        stage=l.stage,
        score=l.score,
        deal_value=l.deal_value,
        source=l.source,
        owner_id=l.owner_id,
        owner_name=l.owner.name if l.owner else None,
        last_activity_at=l.last_activity_at.isoformat(),
        notes=l.notes
    )

@router.get("", response_model=List[LeadRead])
def list_leads(
    stage: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("score", pattern="^(score|deal_value|last_activity_at)$"),
    db: Session = Depends(get_db)
):
    query = db.query(Lead).join(Customer, Lead.customer_id == Customer.id).options(
        joinedload(Lead.customer),
        joinedload(Lead.owner)
    )
    if stage and stage != "all":
        query = query.filter(Lead.stage == stage)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%") | Customer.company.ilike(f"%{search}%"))

    if sort_by == "deal_value":
        query = query.order_by(desc(Lead.deal_value))
    elif sort_by == "last_activity_at":
        query = query.order_by(desc(Lead.last_activity_at))
    else:
        query = query.order_by(desc(Lead.score))

    leads = query.all()
    return [lead_to_read(l) for l in leads]

@router.patch("/{id}", response_model=LeadRead)
def update_lead_stage(id: int, payload: LeadStageUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).options(joinedload(Lead.customer), joinedload(Lead.owner)).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.stage = payload.stage
    if payload.notes:
        lead.notes = payload.notes
    lead.last_activity_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lead)
    return lead_to_read(lead)

@router.post("/bulk-stage")
def bulk_update_lead_stages(payload: BulkLeadStageUpdate, db: Session = Depends(get_db)):
    leads = db.query(Lead).filter(Lead.id.in_(payload.lead_ids)).all()
    now = datetime.now(timezone.utc)
    for lead in leads:
        lead.stage = payload.stage
        lead.last_activity_at = now
    db.commit()
    return {"updated_count": len(leads), "stage": payload.stage}

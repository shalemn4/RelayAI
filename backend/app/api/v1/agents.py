from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.database import get_db
from backend.app.models.agent import Agent
from backend.app.schemas.agent import AgentRead

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("", response_model=List[AgentRead])
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return [AgentRead.model_validate(a) for a in agents]

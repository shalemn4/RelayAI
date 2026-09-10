from sqlalchemy import Column, Integer, String, Float
from backend.app.db.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    status = Column(String(50), default="online")  # online, busy, offline
    conversations_handled = Column(Integer, default=0)
    avg_confidence = Column(Float, default=0.92)
    takeover_rate = Column(Float, default=0.08)
    model = Column(String(100), default="gpt-4o-relay-hybrid")

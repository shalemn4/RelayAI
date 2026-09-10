from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.db.database import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    stage = Column(String(50), default="new", index=True)  # new, contacted, qualified, demo, won, lost
    score = Column(Integer, default=50)  # 0 - 100
    deal_value = Column(Float, default=0.0)
    source = Column(String(100), default="Inbound Web")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_activity_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer")
    owner = relationship("User")

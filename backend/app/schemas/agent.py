from pydantic import BaseModel

class AgentRead(BaseModel):
    id: int
    name: str
    role: str
    description: str
    status: str
    conversations_handled: int
    avg_confidence: float
    takeover_rate: float
    model: str

    class Config:
        from_attributes = True

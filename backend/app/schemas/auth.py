from pydantic import BaseModel, EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

Token.model_rebuild()

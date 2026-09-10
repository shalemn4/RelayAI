from datetime import datetime, timedelta, timezone
from typing import Any, Union
import hashlib
from jose import jwt
from backend.app.core.config import settings

# Lightweight SHA-256 with salt for predictable, robust zero-dependency hashing across Python 3.14
SALT = "relayai_secure_salt_2026"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    expected = hashlib.sha256((plain_password + SALT).encode('utf-8')).hexdigest()
    return expected == hashed_password

def get_password_hash(password: str) -> str:
    return hashlib.sha256((password + SALT).encode('utf-8')).hexdigest()

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

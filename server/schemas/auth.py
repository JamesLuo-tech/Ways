from datetime import datetime
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    email: str
    password: str
    displayName: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    displayName: str
    avatarUrl: str | None = None
    bio: str | None = None
    homeBase: str | None = None
    createdAt: datetime

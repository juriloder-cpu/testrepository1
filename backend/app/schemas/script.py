from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ScriptBase(BaseModel):
    content: str
    ai_provider: Optional[str] = None
    tone: Optional[str] = None
    genre: Optional[str] = None
    length: Optional[str] = None


class ScriptCreate(ScriptBase):
    project_id: int


class ScriptUpdate(BaseModel):
    content: Optional[str] = None
    tone: Optional[str] = None
    genre: Optional[str] = None
    length: Optional[str] = None


class ScriptResponse(ScriptBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScriptGenerateRequest(BaseModel):
    project_id: int
    provider: str  # 'claude' or 'openai'
    tone: Optional[str] = "neutral"
    length: Optional[str] = "medium"
    genre: Optional[str] = "general"
    custom_prompt: Optional[str] = None

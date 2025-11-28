from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class VoiceOverBase(BaseModel):
    voice_id: Optional[str] = None
    voice_provider: Optional[str] = None


class VoiceOverCreate(VoiceOverBase):
    script_id: int


class VoiceOverResponse(VoiceOverBase):
    id: int
    script_id: int
    file_path: str
    duration: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

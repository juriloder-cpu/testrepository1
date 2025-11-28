from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ImageBase(BaseModel):
    prompt: str
    scene_number: Optional[int] = None
    provider: str  # 'leonardo', 'midjourney', 'stable_diffusion'


class ImageCreate(ImageBase):
    project_id: int


class ImageResponse(ImageBase):
    id: int
    project_id: int
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True


class ImageGenerateRequest(BaseModel):
    project_id: int
    script_id: Optional[int] = None  # If provided, auto-generate prompts from script
    prompts: Optional[List[str]] = None  # Manual prompts
    providers: List[str]  # ['leonardo', 'midjourney', 'stable_diffusion']
    auto_generate_from_script: bool = False

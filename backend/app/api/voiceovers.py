from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.voiceover import VoiceOver
from app.schemas.voiceover import VoiceOverCreate, VoiceOverResponse

router = APIRouter(prefix="/api/voiceovers", tags=["voiceovers"])


@router.get("/", response_model=List[VoiceOverResponse])
def get_voiceovers(script_id: int = None, db: Session = Depends(get_db)):
    """Get all voiceovers, optionally filtered by script."""
    query = db.query(VoiceOver)
    if script_id:
        query = query.filter(VoiceOver.script_id == script_id)
    voiceovers = query.order_by(VoiceOver.created_at.desc()).all()
    return voiceovers


@router.get("/{voiceover_id}", response_model=VoiceOverResponse)
def get_voiceover(voiceover_id: int, db: Session = Depends(get_db)):
    """Get a specific voiceover by ID."""
    voiceover = db.query(VoiceOver).filter(VoiceOver.id == voiceover_id).first()
    if not voiceover:
        raise HTTPException(status_code=404, detail="VoiceOver not found")
    return voiceover


# Placeholder - Voice generation will be implemented later
@router.post("/", response_model=VoiceOverResponse)
def create_voiceover(voiceover: VoiceOverCreate, db: Session = Depends(get_db)):
    """Create a new voiceover (placeholder - implementation pending)."""
    raise HTTPException(
        status_code=501,
        detail="Voice over generation not yet implemented"
    )

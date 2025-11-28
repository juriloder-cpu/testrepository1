from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.script import Script
from app.schemas.script import (
    ScriptCreate, ScriptUpdate, ScriptResponse, ScriptGenerateRequest
)
from app.services.script_service import generate_script_with_ai, export_script
import os
from app.core.config import settings

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.get("/", response_model=List[ScriptResponse])
def get_scripts(project_id: int = None, db: Session = Depends(get_db)):
    """Get all scripts, optionally filtered by project."""
    query = db.query(Script)
    if project_id:
        query = query.filter(Script.project_id == project_id)
    scripts = query.order_by(Script.created_at.desc()).all()
    return scripts


@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(script_id: int, db: Session = Depends(get_db)):
    """Get a specific script by ID."""
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@router.post("/", response_model=ScriptResponse)
def create_script(script: ScriptCreate, db: Session = Depends(get_db)):
    """Create a new script manually."""
    db_script = Script(**script.model_dump())
    db.add(db_script)
    db.commit()
    db.refresh(db_script)

    # Save to file
    _save_script_to_file(db_script)

    return db_script


@router.post("/generate", response_model=ScriptResponse)
async def generate_script(
    request: ScriptGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate a script using AI."""
    try:
        content = await generate_script_with_ai(db, request)

        # Create script in database
        script = Script(
            project_id=request.project_id,
            content=content,
            ai_provider=request.provider,
            tone=request.tone,
            genre=request.genre,
            length=request.length
        )
        db.add(script)
        db.commit()
        db.refresh(script)

        # Save to file
        _save_script_to_file(script)

        return script

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating script: {str(e)}")


@router.put("/{script_id}", response_model=ScriptResponse)
def update_script(
    script_id: int,
    script_update: ScriptUpdate,
    db: Session = Depends(get_db)
):
    """Update a script."""
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    for key, value in script_update.model_dump(exclude_unset=True).items():
        setattr(script, key, value)

    db.commit()
    db.refresh(script)

    # Update file
    _save_script_to_file(script)

    return script


@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    """Delete a script."""
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    # Delete file
    _delete_script_file(script)

    db.delete(script)
    db.commit()
    return {"message": "Script deleted successfully"}


@router.get("/{script_id}/export")
def export_script_endpoint(
    script_id: int,
    format: str = "txt",
    db: Session = Depends(get_db)
):
    """Export script as .txt or .md file."""
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    if format not in ["txt", "md"]:
        raise HTTPException(status_code=400, detail="Format must be 'txt' or 'md'")

    content = export_script(script, format)
    media_type = "text/markdown" if format == "md" else "text/plain"
    filename = f"script_{script.id}.{format}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _save_script_to_file(script: Script):
    """Save script content to file."""
    storage_path = os.path.join(settings.STORAGE_PATH, "scripts")
    os.makedirs(storage_path, exist_ok=True)

    file_path = os.path.join(storage_path, f"script_{script.id}.txt")
    with open(file_path, "w") as f:
        f.write(script.content)


def _delete_script_file(script: Script):
    """Delete script file."""
    storage_path = os.path.join(settings.STORAGE_PATH, "scripts")
    file_path = os.path.join(storage_path, f"script_{script.id}.txt")

    if os.path.exists(file_path):
        os.remove(file_path)

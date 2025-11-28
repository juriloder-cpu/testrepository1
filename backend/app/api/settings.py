from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.setting import Setting
from app.schemas.setting import (
    SettingCreate, SettingUpdate, SettingResponse, SettingValueResponse
)
from app.services.setting_service import get_setting_value, set_setting_value

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/", response_model=List[SettingResponse])
def get_all_settings(db: Session = Depends(get_db)):
    """Get all settings (without decrypted values)."""
    settings = db.query(Setting).all()
    return settings


@router.get("/{key_name}", response_model=SettingValueResponse)
def get_setting(key_name: str, db: Session = Depends(get_db)):
    """Get a specific setting with decrypted value."""
    value = get_setting_value(db, key_name)
    setting = db.query(Setting).filter(Setting.key_name == key_name).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    return SettingValueResponse(
        id=setting.id,
        key_name=setting.key_name,
        value=value or "",
        description=setting.description
    )


@router.post("/", response_model=SettingResponse)
def create_setting(setting: SettingCreate, db: Session = Depends(get_db)):
    """Create a new setting."""
    existing = db.query(Setting).filter(Setting.key_name == setting.key_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Setting already exists")

    db_setting = set_setting_value(
        db,
        setting.key_name,
        setting.value,
        setting.description
    )
    return db_setting


@router.put("/{key_name}", response_model=SettingResponse)
def update_setting(
    key_name: str,
    setting_update: SettingUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing setting."""
    setting = db.query(Setting).filter(Setting.key_name == key_name).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    updated_setting = set_setting_value(
        db,
        key_name,
        setting_update.value,
        setting_update.description
    )
    return updated_setting


@router.delete("/{key_name}")
def delete_setting(key_name: str, db: Session = Depends(get_db)):
    """Delete a setting."""
    setting = db.query(Setting).filter(Setting.key_name == key_name).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted successfully"}

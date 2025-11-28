from sqlalchemy.orm import Session
from app.models.setting import Setting
from app.core.security import encrypt_value, decrypt_value
from typing import Optional


def get_setting_value(db: Session, key_name: str) -> Optional[str]:
    """Get decrypted setting value by key name."""
    setting = db.query(Setting).filter(Setting.key_name == key_name).first()
    if not setting:
        return None

    try:
        return decrypt_value(setting.encrypted_value)
    except Exception:
        return None


def set_setting_value(db: Session, key_name: str, value: str, description: str = None) -> Setting:
    """Create or update a setting with encrypted value."""
    setting = db.query(Setting).filter(Setting.key_name == key_name).first()

    encrypted = encrypt_value(value)

    if setting:
        setting.encrypted_value = encrypted
        if description:
            setting.description = description
    else:
        setting = Setting(
            key_name=key_name,
            encrypted_value=encrypted,
            description=description
        )
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting

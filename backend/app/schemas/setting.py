from pydantic import BaseModel
from typing import Optional


class SettingBase(BaseModel):
    key_name: str
    description: Optional[str] = None


class SettingCreate(SettingBase):
    value: str  # This will be encrypted before storage


class SettingUpdate(BaseModel):
    value: str  # This will be encrypted before storage
    description: Optional[str] = None


class SettingResponse(SettingBase):
    id: int
    # Note: We don't return the encrypted_value for security

    class Config:
        from_attributes = True


class SettingValueResponse(SettingBase):
    id: int
    value: str  # Decrypted value (only for authorized requests)

    class Config:
        from_attributes = True

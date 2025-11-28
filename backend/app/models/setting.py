from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String, unique=True, nullable=False, index=True)
    encrypted_value = Column(Text, nullable=False)
    description = Column(String, nullable=True)

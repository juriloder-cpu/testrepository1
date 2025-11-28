from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class VoiceOver(Base):
    __tablename__ = "voiceovers"

    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=False)
    file_path = Column(String, nullable=False)
    voice_id = Column(String, nullable=True)
    voice_provider = Column(String, nullable=True)  # For future use
    duration = Column(Integer, nullable=True)  # Duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    script = relationship("Script", back_populates="voiceovers")

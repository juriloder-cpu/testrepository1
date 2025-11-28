from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    content = Column(Text, nullable=False)
    ai_provider = Column(String, nullable=True)  # 'claude', 'openai', or None for manual
    tone = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    length = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="scripts")
    voiceovers = relationship("VoiceOver", back_populates="script", cascade="all, delete-orphan")

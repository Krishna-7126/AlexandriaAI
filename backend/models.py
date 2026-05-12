"""
Database models for Alexandria AI Learning Companion
"""
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./alexandria.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    """User model for storing user information and preferences"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    preferred_language = Column(String, default="en")  # Language code like 'en', 'es', 'fr'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    saved_videos = relationship("SavedVideo", back_populates="user", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    """Session storage for multi-turn conversations"""
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    video_id = Column(String, index=True)
    conversation_data = Column(Text)  # JSON formatted conversation history
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class SavedVideo(Base):
    """Saved videos for user library"""
    __tablename__ = "saved_videos"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    video_id = Column(String, index=True)
    title = Column(String)
    source = Column(String)  # 'youtube', 'podcast', 'spotify', 'local'
    url = Column(String)
    thumbnail = Column(String, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="saved_videos")


class Export(Base):
    """Track exports to external platforms"""
    __tablename__ = "exports"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    video_id = Column(String, index=True)
    export_type = Column(String)  # 'notion', 'google_doc', 'markdown'
    export_url = Column(String)  # URL to exported resource
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="exports")


class QuizQuestion(Base):
    """Stored quiz questions for spaced repetition and performance tracking"""
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=True)
    session_id = Column(String, index=True, nullable=True)
    video_id = Column(String, index=True)
    concept = Column(String, nullable=True)
    question_type = Column(String, default="mcq")
    question_text = Column(Text)
    correct_answer = Column(Text)
    options_json = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    timestamp = Column(Float, default=0.0)
    difficulty = Column(String, default="medium")
    attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    next_review_at = Column(DateTime, default=datetime.utcnow)
    last_review_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QuizResponse(Base):
    """Individual quiz attempts and answer history"""
    __tablename__ = "quiz_responses"

    id = Column(String, primary_key=True, index=True)
    question_id = Column(String, ForeignKey("quiz_questions.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=True)
    session_id = Column(String, index=True, nullable=True)
    video_id = Column(String, index=True)
    answer = Column(Text)
    is_correct = Column(Boolean, default=False)
    score = Column(Integer, default=0)
    feedback = Column(Text, nullable=True)
    answered_at = Column(DateTime, default=datetime.utcnow)


# Create all tables
Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

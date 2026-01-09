from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class JobStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255), nullable=False, index=True)
    position = Column(String(255), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.APPLIED)
    location = Column(String(255), nullable=True)
    salary_range = Column(String(100), nullable=True)
    job_url = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # LinkedIn, Indeed, etc.
    notes = Column(Text, nullable=True)
    email_id = Column(String(255), nullable=True, unique=True)  # Gmail message ID
    applied_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class UserToken(Base):
    __tablename__ = "user_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())



from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models import JobStatus


class JobApplicationBase(BaseModel):
    company: str
    position: str
    status: JobStatus = JobStatus.APPLIED
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None


class JobApplicationCreate(JobApplicationBase):
    email_id: Optional[str] = None


class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[JobStatus] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    applied_date: Optional[datetime] = None


class JobApplicationResponse(JobApplicationBase):
    id: int
    email_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobApplicationList(BaseModel):
    items: list[JobApplicationResponse]
    total: int



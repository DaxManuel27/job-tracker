from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models import JobApplication, JobStatus
from app.schemas import (
    JobApplicationCreate,
    JobApplicationUpdate,
    JobApplicationResponse,
    JobApplicationList,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=JobApplicationList)
async def get_jobs(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[JobStatus] = None,
    search: Optional[str] = None,
):
    """Get all job applications with optional filtering."""
    query = select(JobApplication)
    
    if status:
        query = query.where(JobApplication.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            (JobApplication.company.ilike(search_term)) |
            (JobApplication.position.ilike(search_term))
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Get paginated results
    query = query.order_by(JobApplication.applied_date.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return JobApplicationList(items=jobs, total=total)


@router.get("/{job_id}", response_model=JobApplicationResponse)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific job application by ID."""
    result = await db.execute(
        select(JobApplication).where(JobApplication.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    return job


@router.post("", response_model=JobApplicationResponse)
async def create_job(job: JobApplicationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new job application."""
    db_job = JobApplication(**job.model_dump())
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job


@router.patch("/{job_id}", response_model=JobApplicationResponse)
async def update_job(
    job_id: int,
    job_update: JobApplicationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a job application."""
    result = await db.execute(
        select(JobApplication).where(JobApplication.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    update_data = job_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    await db.commit()
    await db.refresh(job)
    return job


@router.delete("/{job_id}")
async def delete_job(job_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a job application."""
    result = await db.execute(
        select(JobApplication).where(JobApplication.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")
    
    await db.delete(job)
    await db.commit()
    return {"message": "Job application deleted"}



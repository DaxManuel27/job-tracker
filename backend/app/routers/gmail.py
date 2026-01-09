from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime

from app.config import get_settings
from app.database import get_db
from app.models import UserToken, JobApplication, JobStatus
from app.services.parser import parse_job_email

router = APIRouter(prefix="/gmail", tags=["gmail"])
settings = get_settings()


async def get_gmail_service(db: AsyncSession):
    """Get authenticated Gmail service."""
    result = await db.execute(select(UserToken).limit(1))
    user_token = result.scalar_one_or_none()
    
    if not user_token:
        raise HTTPException(status_code=401, detail="Not authenticated with Gmail")
    
    credentials = Credentials(
        token=user_token.access_token,
        refresh_token=user_token.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    
    return build("gmail", "v1", credentials=credentials)


@router.get("/sync")
async def sync_emails(db: AsyncSession = Depends(get_db)):
    """Fetch and parse job-related emails from Gmail."""
    try:
        service = await get_gmail_service(db)
        
        # Search for job-related emails
        query = (
            "subject:(application OR applied OR interview OR offer OR rejected OR "
            '"thank you for applying" OR "we received your application" OR '
            '"application status" OR "job application")'
        )
        
        results = service.users().messages().list(
            userId="me",
            q=query,
            maxResults=50,
        ).execute()
        
        messages = results.get("messages", [])
        new_jobs = 0
        
        for msg in messages:
            # Check if we already processed this email
            existing = await db.execute(
                select(JobApplication).where(JobApplication.email_id == msg["id"])
            )
            if existing.scalar_one_or_none():
                continue
            
            # Get full message details
            full_msg = service.users().messages().get(
                userId="me",
                id=msg["id"],
                format="full",
            ).execute()
            
            # Parse the email
            job_data = parse_job_email(full_msg)
            
            if job_data:
                job = JobApplication(
                    company=job_data.get("company", "Unknown"),
                    position=job_data.get("position", "Unknown Position"),
                    status=job_data.get("status", JobStatus.APPLIED),
                    source=job_data.get("source"),
                    email_id=msg["id"],
                    applied_date=job_data.get("date"),
                )
                db.add(job)
                new_jobs += 1
        
        await db.commit()
        
        return {
            "message": f"Sync complete. Found {len(messages)} job emails, added {new_jobs} new applications.",
            "emails_found": len(messages),
            "new_applications": new_jobs,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync emails: {str(e)}")


@router.get("/test")
async def test_connection(db: AsyncSession = Depends(get_db)):
    """Test Gmail API connection."""
    try:
        service = await get_gmail_service(db)
        profile = service.users().getProfile(userId="me").execute()
        return {
            "connected": True,
            "email": profile.get("emailAddress"),
            "total_messages": profile.get("messagesTotal"),
        }
    except Exception as e:
        return {"connected": False, "error": str(e)}



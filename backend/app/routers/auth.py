from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.config import get_settings
from app.database import get_db
from app.models import UserToken

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
]


def get_flow():
    """Create OAuth flow - requires credentials.json from Google Cloud Console."""
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = settings.google_redirect_uri
    return flow


@router.get("/login")
async def login():
    """Initiate Google OAuth login flow."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )
    
    flow = get_flow()
    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return {"auth_url": authorization_url}


@router.get("/callback")
async def callback(code: str, db: AsyncSession = Depends(get_db)):
    """Handle OAuth callback from Google."""
    try:
        flow = get_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user email from credentials
        from googleapiclient.discovery import build
        service = build("oauth2", "v2", credentials=credentials)
        user_info = service.userinfo().get().execute()
        email = user_info.get("email")
        
        # Store or update token in database
        result = await db.execute(
            select(UserToken).where(UserToken.email == email)
        )
        user_token = result.scalar_one_or_none()
        
        if user_token:
            user_token.access_token = credentials.token
            user_token.refresh_token = credentials.refresh_token or user_token.refresh_token
            user_token.token_expiry = credentials.expiry
        else:
            user_token = UserToken(
                email=email,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expiry=credentials.expiry,
            )
            db.add(user_token)
        
        await db.commit()
        
        # Redirect to frontend with success
        return RedirectResponse(url=f"{settings.frontend_url}?auth=success&email={email}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")


@router.get("/status")
async def auth_status(db: AsyncSession = Depends(get_db)):
    """Check if user is authenticated."""
    result = await db.execute(select(UserToken).limit(1))
    user_token = result.scalar_one_or_none()
    
    if user_token and user_token.token_expiry and user_token.token_expiry > datetime.utcnow():
        return {"authenticated": True, "email": user_token.email}
    
    return {"authenticated": False, "email": None}


@router.post("/logout")
async def logout(db: AsyncSession = Depends(get_db)):
    """Clear stored OAuth tokens."""
    result = await db.execute(select(UserToken))
    tokens = result.scalars().all()
    
    for token in tokens:
        await db.delete(token)
    
    await db.commit()
    return {"message": "Logged out successfully"}



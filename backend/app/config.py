from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Job Tracker"
    database_url: str = "sqlite+aiosqlite:///./job_tracker.db"
    
    # Google OAuth settings
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/callback"
    
    # Frontend URL for CORS
    frontend_url: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()



from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth, jobs, gmail

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    await init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title=settings.app_name,
    description="Track job applications from Gmail",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(gmail.router)


@app.get("/")
async def root():
    return {
        "message": "Job Tracker API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}



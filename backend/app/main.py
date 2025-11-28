from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import projects, scripts, images, settings as settings_api, voiceovers

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Story Video Creation API",
    description="API for creating AI-generated story videos",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)
app.include_router(scripts.router)
app.include_router(images.router)
app.include_router(settings_api.router)
app.include_router(voiceovers.router)


@app.get("/")
def root():
    return {
        "message": "AI Story Video Creation API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

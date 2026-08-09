from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.db.database import Base, engine
from app.db import models
app = FastAPI(title="TrustLens API")

# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="TrustLens API",
    version="1.0.0",
    description="AI-powered Digital Trust & Decision Intelligence"
)


# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to TrustLens API 🛡️"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
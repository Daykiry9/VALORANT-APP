from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VAL Analytics Platform API")

# Secure CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Backwards compatibility while refactoring routes
from routers import scrims
from api.routes import teams, players, auth, analytics, ai, reports

app.include_router(scrims.router, prefix="/api/scrims", tags=["scrims"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
def read_root():
    return {
        "status": "ready", 
        "message": "VAL Analytics Platform API v1.0 Production",
        "engines": ["Claude 3.5", "Gemini 2.5"]
    }

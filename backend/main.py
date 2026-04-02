from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="VAL Analytics Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backwards compatibility while refactoring routes
from routers import scrims
from api.routes import teams, players, auth, analytics, ai

app.include_router(scrims.router, prefix="/api/scrims", tags=["scrims"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "VAL Analytics Platform API is running safely with Gemini AI"}

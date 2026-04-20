# VAL Analytics — Competitive Valorant Platform

**Post-match analytics and scrim management platform for competitive Valorant teams.**

## Overview
VAL Analytics helps coaches and players at the Premier and semi-professional level 
track scrimmage performance, analyze official matches, and get AI-powered tactical 
insights to improve their game.

## Features
- 📊 **Scrim Tracker** — Upload end-game screenshots; OCR extracts all player stats automatically
- 🎯 **Player Performance** — ACS, K/D, KAST, ADR, death order analysis, benchmarks vs VCT pros
- 🛡️ **Team Analysis** — Map pool efficiency, composition win rates, scrims vs official comparison
- ⚡ **AI Insights** — Gemini 2.5 Flash generates structured tactical briefings, player weakness reports, tryout verdicts, and composition reads
- 🔗 **Riot API Integration** — Players opt-in via RSO to sync official and custom game history
- 👥 **Tryout Comparator** — Side-by-side player comparison with AI evaluation

## Data & Privacy
All player data requires explicit opt-in through Riot Sign On (RSO).
No data is collected or displayed for players who have not authorized the platform.
All analysis is post-match only — no real-time overlays or in-game data.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Python FastAPI + SQLAlchemy + PostgreSQL
- **Auth**: Supabase (Google OAuth) + Riot RSO
- **AI**: Google Gemini 2.5 Flash (structured JSON output, Pydantic-validated)
- **Migrations**: Alembic
- **Deploy**: Vercel (frontend) + Railway (backend)

## Getting started (dev)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate  # or .venv/bin/activate on *nix
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY, SUPABASE_JWT_SECRET, etc.
alembic upgrade head   # create schema
uvicorn main:app --reload
```

Dev auth bypass: set `DEV_AUTH_BYPASS=1` in `.env` to skip Supabase JWT validation and fall back to the first user/team row.

### Frontend
```bash
cd frontend
pnpm install   # or npm install
pnpm dev
```

Env: set `VITE_API_BASE_URL=http://localhost:8000`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Legal
This product is not affiliated with or endorsed by Riot Games, Inc.
VALORANT and Riot Games are trademarks of Riot Games, Inc.

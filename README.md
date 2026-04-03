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
- ⚡ **AI Insights** — Claude AI generates actionable tactical recommendations post-match
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
- **AI**: Google Gemini 2.0 Flash API (Free Tier)
- **Deploy**: Vercel (frontend) + Railway (backend)

## Legal
This product is not affiliated with or endorsed by Riot Games, Inc.
VALORANT and Riot Games are trademarks of Riot Games, Inc.

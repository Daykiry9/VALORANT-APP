# VAL Analytics — Professional Tactical Platform

VAL Analytics is an elite performance tracking and tactical analysis platform designed for competitive Valorant teams (Premier, Challengers, and Pro-Circuit).

![Dashboard Preview](https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070)

## 🚀 Core Features
- **OCR Scrim Tracker**: Instant data extraction from scoreboard screenshots.
- **RSO Integration**: Automatic match synchronization via Official Riot Sign-On.
- **AI Tactical Insights**: Pro-level feedback powered by Claude 3.5 & Gemini 2.5.
- **Advanced Performance Analytics**: Deep-dive into KAST, ADR, FB/FD ratios, and map-specific trends.
- **Team Global HQ**: Centralized dashboard for organizations to track multiple rosters.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL.
- **AI**: Anthropic Claude & Google Gemini.
- **Auth/DB**: Supabase (PostgreSQL + Google OAuth).

## 📦 Setup & Installation

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `.\venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. Create `.env` based on `.env.example`
6. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env` based on `.env.example`
4. `npm run dev`

## ⚖️ Legal Disclaimer
VAL Analytics is not affiliated with or endorsed by Riot Games, Inc. VALORANT and Riot Games are trademarks or registered trademarks of Riot Games, Inc. in the U.S. and elsewhere.

---
*Built for coaches who know that data is the shortest path to a Major.*

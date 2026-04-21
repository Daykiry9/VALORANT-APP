# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Post-match competitive Valorant analytics SaaS: scrim ingestion via OCR + Riot API, per-player / per-team / per-opponent aggregates, and Gemini 2.5 Flash-driven tactical briefings. Target users are coaches, analysts, and Tier-1/2 esports orgs — correctness of analytics math is non-negotiable.

## Repo layout

Monorepo. Two independent apps:

- **`backend/`** — FastAPI + SQLAlchemy 2 + Pydantic 2 + Alembic + Gemini (`google-generativeai` 0.8.3). Flat package layout — `from database import Base`, `import models`, etc. No `backend/__init__.py`. When adding new top-level folders under `backend/` (`core/foo`, `api/routes/foo`), you generally do NOT need `__init__.py` files; existing code relies on PEP 420 namespace packages.
- **`frontend/`** — React 19 + Vite 8 + Tailwind 3 + React Router 7 + framer-motion + recharts + @tanstack/react-table + Supabase JS. Dashboard routes are code-split via `React.lazy` in `App.tsx` — landing/login bundle stays small.
- Root `package.json` is vestigial (leftover Tailwind v4 experiment). All real frontend deps live in `frontend/package.json`. Deploy is Vercel (see `vercel.json`) — only the frontend deploys there; backend must run separately.

## Commands

### Backend
```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # .venv/bin/activate on *nix
pip install -r requirements.txt
cp .env.example .env   # fill GEMINI_API_KEY, SUPABASE_JWT_SECRET, DEV_AUTH_BYPASS=1 for local
alembic upgrade head
DEV_AUTH_BYPASS=1 uvicorn main:app --reload
```

Pytest (hitting an in-memory SQLite; `conftest.py` sets `DEV_AUTH_BYPASS=1` and `RATE_LIMIT_ENABLED=0` before the app imports):
```bash
.venv/Scripts/python -m pytest tests/          # full suite
.venv/Scripts/python -m pytest tests/test_analytics.py::test_team_summary_math -x  # single test
```

New Alembic migration (auto-generate from model changes):
```bash
alembic revision --autogenerate -m "add_foo"
alembic upgrade head
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # vite dev server on 5173
npm run build      # production build; vite also runs type-aware transform
npm run lint       # eslint 9
```

There is **no `tsc` / no TypeScript compiler installed**. Type errors do NOT block the build — Vite uses esbuild which strips types. Catching type errors requires running `npx tsc --noEmit` manually after installing TypeScript, or trusting IDE diagnostics.

## Architecture — the parts that span files

### Auth / team context
Every data endpoint takes `AuthContext = Depends(get_current_user)` from [backend/core/auth/current_user.py](backend/core/auth/current_user.py). This validates the Supabase JWT (HS256, secret in `SUPABASE_JWT_SECRET`), mirrors the user into the local `users` table on first contact, and resolves `team_id / org_id / plan / role`. Routes call `auth.require_team()` to derive the `team_id` used in queries — never trust a `team_id` from a client path without comparing against this.

`DEV_AUTH_BYPASS=1` skips JWT validation and falls back to the first user/team in the DB. Intended for local dev and the pytest suite only.

### Analytics pipeline (backend/core/analytics/)
- `player_aggregates.py` → `summary / by_agent / by_map / trend`
- `team_aggregates.py` → `summary / map_pool / side_winrate / composition_performance / opponent_tier_winrate`
- `scouting.py` → per-opponent reports (drives the scouting page)
- `benchmarks.py` → dynamic role P25/P50/P75; falls back to hardcoded VCT pro averages if `sample_size < 50`
- `comparison.py` → pairwise diffs for Tryouts

All functions are wrapped with `@cached(namespace, ttl=300)` from `core/cache.py`. **Mutations must call `invalidate_team(team_id)`** (see `routers/scrims.py::create_scrim`) or analytics stay stale.

### Gemini AI layer (backend/core/ai/)
Structured output only. Flow:
1. `config.py::get_json_model()` instantiates Gemini with `response_mime_type="application/json"` and the Pydantic-derived `response_schema`.
2. `structured.py::generate_structured(prompt, schema, params)` validates Gemini's response through Pydantic and retries once with a repair prompt on parse failure.
3. Each prompt is a dedicated module in `core/ai/prompts/` (`match_tactical`, `player_weakness`, `tryout_verdict`, `composition`, `scouting`). Prompts are structured with **stable prefix first** (persona + instructions + few-shot examples) and **dynamic data last** so Gemini 2.5 Flash's implicit caching can hit the prefix across calls — do not reorder.

To add a new prompt:
1. Write output Pydantic schema in `schemas.py` (or a prompts module)
2. Add prompt module in `core/ai/prompts/foo.py` following the pattern
3. Call via `generate_structured(...)` — do not call `genai` directly
4. Persist results to the `match_insights` table if they're match-scoped (see `api/routes/ai.py::_persist_match_insight`)

### Rate limiting
`core/ratelimit.py` wires slowapi. Limits are opt-in per route via `@limiter.limit("N/minute;N/hour")` and every rate-limited endpoint must accept `request: Request` (slowapi requirement). All AI routes and the comparison endpoint are limited. Keyed by `X-Team-Id` header if the frontend sends it, else client IP. Tests disable this via `RATE_LIMIT_ENABLED=0`.

### Error shape
Every exception goes through the global handler in `main.py` which emits `{ "error": { code, message, request_id, details } }`. Use the typed errors from `core/errors.py` (`NotFound`, `Forbidden`, `UpstreamError`, ...) — do not raise raw `HTTPException` from new code.

### Frontend routing & contexts
`App.tsx` defines the full route tree. `<ProtectedRoute>` wraps `<AppShell>` which wraps `<TeamProvider>` + `<OnboardingGate>` — pages always have a team when rendering (the gate redirects to team creation otherwise). Navigation and state:
- `TeamContext` (persisted to `localStorage`) holds the current team id — every page uses `useTeam()` to derive `currentTeamId` and trigger re-fetches.
- `api.ts` injects the Supabase bearer token automatically — call `await api.getXxx()` without worrying about auth headers.
- UI primitives live in `components/ui/` (`Badge`, `ResultPill`, `AgentPortrait`, `MapThumbnail`, `DataBoundary`, `KPITile`). Use `<DataBoundary loading error empty>` around every fetch — never render raw loading states ad-hoc.

### Valorant assets
`lib/valorantAssets.ts` pulls agent portraits and map splashes from `valorant-api.com` (community CDN, no auth). First call primes an in-memory cache; there is no persistence. If you add a new Valorant data dependency, extend this helper instead of fetching from another source.

## Conventions

- **Do not add `__init__.py`** files under `backend/core/` or `backend/api/routes/` unless you need to run init code. PEP 420 namespace packages work fine and the existing code relies on this.
- **Do not add `from __future__ import annotations`** to route modules. It breaks FastAPI's type-hint resolution when combined with the slowapi decorator — `from __future__ import annotations` + `@limiter.limit` + Pydantic body annotation = `PydanticUndefinedAnnotation`. Other modules can use it.
- Pydantic response models are required on every new route (`response_model=...`). Untyped routes are the exception and need justification.
- Spanish is the primary UI language. Keep user-facing strings and prompts in Spanish; keep code, identifiers, log messages in English.
- Design tokens are in `frontend/tailwind.config.js` — use `bg-bg-surface`, `text-text-secondary`, `border-border-default`, `text-accent`, `text-success`, role tokens (`role-duelist`, etc.), and tier tokens (`tier-t1`, ...). Do not hardcode hex values.
- OCR output uses field name `name`; the scrim POST schema uses `display_name`. The frontend maps between them in `ScrimTracker.tsx::ocrToDraft` — keep this conversion centralized.
- Background jobs, round-by-round Riot API ingestion, and fine-grained plan gating are **deferred** (see the project plan in `.claude/plans/`). Don't wire them in piecemeal.

## Legal

This product is not affiliated with or endorsed by Riot Games, Inc. VALORANT and Riot Games are trademarks of Riot Games, Inc.

import os
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from core.errors import AppError
from core.middleware import RequestIDMiddleware, current_request_id
from core.ratelimit import limiter

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="VAL Analytics Platform API", version="1.1.0")

# Order matters: request-id first, then rate-limiter so rate-limit responses carry the id.
app.add_middleware(RequestIDMiddleware)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


def _error_payload(code: str, message: str, details: dict | None = None) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": current_request_id(),
            "details": details or {},
        }
    }


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.code, exc.message, exc.details),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exc_handler(_: Request, exc: StarletteHTTPException):
    code_map = {401: "unauthorized", 403: "forbidden", 404: "not_found", 409: "conflict"}
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(
            code_map.get(exc.status_code, "http_error"),
            str(exc.detail) if exc.detail else "HTTP error",
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exc_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=_error_payload("validation_error", "Invalid request body.", {"errors": exc.errors()}),
    )


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content=_error_payload(
            "rate_limited",
            "Too many requests. Please wait and retry.",
            {"limit": str(exc.detail) if exc.detail else None},
        ),
    )


@app.exception_handler(Exception)
async def unhandled_exc_handler(_: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content=_error_payload("internal_error", "Unexpected server error."),
    )


# Routers
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
        "message": "VAL Analytics Platform API",
        "version": "1.1.0",
        "engines": [os.getenv("GEMINI_MODEL", "gemini-2.5-flash")],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}

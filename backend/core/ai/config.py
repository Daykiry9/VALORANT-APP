"""Central Gemini config. One place to change the model or defaults."""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai


_configured = False


def _configure_once() -> bool:
    global _configured
    if _configured:
        return True
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return False
    genai.configure(api_key=key)
    _configured = True
    return True


def is_enabled() -> bool:
    return _configure_once()


def model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


@dataclass(frozen=True)
class GenParams:
    temperature: float = 0.3
    max_output_tokens: int = 1500
    top_p: float = 0.9


def get_model(params: Optional[GenParams] = None) -> genai.GenerativeModel:
    _configure_once()
    p = params or GenParams()
    gen_config = {
        "temperature": p.temperature,
        "max_output_tokens": p.max_output_tokens,
        "top_p": p.top_p,
    }
    return genai.GenerativeModel(model_name(), generation_config=gen_config)


def get_json_model(params: Optional[GenParams] = None, response_schema: Optional[dict] = None) -> genai.GenerativeModel:
    """Variant that forces JSON output. `response_schema` is an optional JSON schema."""
    _configure_once()
    p = params or GenParams()
    gen_config = {
        "temperature": p.temperature,
        "max_output_tokens": p.max_output_tokens,
        "top_p": p.top_p,
        "response_mime_type": "application/json",
    }
    if response_schema:
        gen_config["response_schema"] = response_schema
    return genai.GenerativeModel(model_name(), generation_config=gen_config)

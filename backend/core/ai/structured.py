"""Thin harness around Gemini for JSON-structured responses validated with Pydantic.

Usage:

    content: MatchInsightContent = generate_structured(
        prompt=prompt,
        schema=MatchInsightContent,
        params=GenParams(temperature=0.3, max_output_tokens=1500),
    )
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional, Type, TypeVar

from pydantic import BaseModel, ValidationError

from core.ai.config import GenParams, get_json_model, is_enabled, model_name
from core.errors import UpstreamError

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def generate_structured(
    prompt: str,
    schema: Type[T],
    params: Optional[GenParams] = None,
    images: Optional[list[Any]] = None,
) -> T:
    """Run Gemini with a forced JSON response, validate with the Pydantic `schema`.

    On parse failure we retry once with a short repair instruction. Raises
    `UpstreamError` if Gemini is unavailable or validation fails after retry.
    """
    if not is_enabled():
        raise UpstreamError("Gemini API key not configured.")

    model = get_json_model(params, response_schema=_pydantic_to_gemini_schema(schema))

    parts: list[Any] = [prompt]
    if images:
        parts = [prompt, *images]

    try:
        response = model.generate_content(parts)
    except Exception as e:
        raise UpstreamError(f"Gemini error: {e}")

    text = _clean_json(response.text or "")
    try:
        return schema.model_validate_json(text)
    except (ValidationError, ValueError) as first_err:
        # Repair pass — ask the model to rewrite into strict JSON.
        log.warning("First JSON parse failed: %s. Retrying with repair prompt.", first_err)
        repair_prompt = (
            "The previous response could not be parsed as JSON matching the required schema. "
            "Re-emit ONLY a valid JSON object matching the schema. No markdown, no prose. "
            "Previous output:\n" + text
        )
        try:
            response2 = model.generate_content([repair_prompt])
            text2 = _clean_json(response2.text or "")
            return schema.model_validate_json(text2)
        except Exception as second_err:
            raise UpstreamError(
                f"AI output failed schema validation after retry: {second_err}"
            )


def _clean_json(raw: str) -> str:
    t = raw.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:]
    return t.strip()


def _pydantic_to_gemini_schema(model: Type[BaseModel]) -> dict:
    """Pydantic v2 JSON Schema -> Gemini's reduced OpenAPI-subset schema.

    Strips `$defs`, `title`, `additionalProperties`, etc. Good enough for the
    simple schemas we emit.
    """
    raw = model.model_json_schema()
    return _simplify(raw, raw.get("$defs", {}))


_ALLOWED_KEYS = {"type", "properties", "items", "required", "enum", "description", "format"}


def _simplify(node: Any, defs: dict) -> Any:
    if isinstance(node, dict):
        # Inline $ref
        if "$ref" in node:
            ref = node["$ref"].split("/")[-1]
            return _simplify(defs.get(ref, {}), defs)
        out: dict = {}
        for k, v in node.items():
            if k not in _ALLOWED_KEYS:
                continue
            out[k] = _simplify(v, defs)
        # Gemini requires type when properties are present.
        if "properties" in out and "type" not in out:
            out["type"] = "object"
        return out
    if isinstance(node, list):
        return [_simplify(v, defs) for v in node]
    return node

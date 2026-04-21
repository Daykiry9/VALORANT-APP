"""Shared helpers for analytics aggregators."""


def pct(num: float, den: float) -> float:
    """Percentage rounded to 1 decimal. Returns 0.0 when den is 0."""
    if not den:
        return 0.0
    return round((num / den) * 100, 1)

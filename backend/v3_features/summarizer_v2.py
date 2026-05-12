"""Multi-level summarizer prototypes (v3 stub)."""
from typing import Dict, Any


def summarize_eli5(transcript: str) -> str:
    return "(ELI5) " + (transcript[:300] + '...') if transcript else ""


def summarize_standard(transcript: str) -> str:
    return (transcript[:800] + '...') if transcript else ""


def summarize_expert(transcript: str) -> str:
    return (transcript[:1400] + '...') if transcript else ""


def summarize_tldr(transcript: str) -> str:
    words = (transcript or "").split()
    return ' '.join(words[:20]) + '...' if words else ""

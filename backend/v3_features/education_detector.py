"""Educational content detection helpers (v3 stub).

These functions are intentionally lightweight stubs so they can be iterated on
quickly. Replace LLM calls with production prompts later.
"""
from typing import List, Dict, Any


def detect_educational_sections(transcript: str) -> List[Dict[str, Any]]:
    """Return list of detected educational sections with start/end timestamps.

    Stub: returns a single full-range section if transcript exists.
    """
    if not transcript or not transcript.strip():
        return []
    return [{"start": 0.0, "end": 99999.0, "confidence": 0.5, "text": transcript}]


def score_educational_relevance(text: str) -> int:
    """Return a 0-100 heuristic educational relevance score."""
    if not text:
        return 0
    length = len(text.split())
    if length < 30:
        return 20
    if length < 200:
        return 50
    return 75


def identify_teaching_patterns(transcript: str) -> str:
    """Detects a teaching pattern: lecture/demo/discussion (stub)."""
    return "lecture"


def extract_implied_objectives(content: str) -> List[str]:
    """Return a list of inferred learning objectives (stub)."""
    if not content:
        return []
    return ["Understand the main idea", "Recognize key concepts"]


def filter_non_educational_segments(transcript: str) -> str:
    """Return a filtered transcript with obvious non-educational lines removed (stub)."""
    return transcript

"""Study notes generation helpers for v3.

The goal is to convert a transcript into compact study artifacts that are easy
to render in the frontend without relying on an LLM call.
"""
from __future__ import annotations

from typing import Any
import re


def _sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in re.split(r"(?<=[.?!])\s+|\n+", text or "") if sentence.strip()]


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip().rstrip(".?!")


def _top_terms(transcript: str, concepts: list[dict[str, Any]] | None = None, limit: int = 6) -> list[str]:
    term_counts: dict[str, int] = {}
    for word in re.findall(r"[A-Za-z][A-Za-z0-9_'-]+", transcript or ""):
        word_l = word.lower().strip("-_'\"")
        if len(word_l) < 5:
            continue
        term_counts[word_l] = term_counts.get(word_l, 0) + 1

    for concept in concepts or []:
        name = str(concept.get("name", "")).strip()
        if name:
            term_counts[name.lower()] = term_counts.get(name.lower(), 0) + 3

    ordered = sorted(term_counts.items(), key=lambda item: (-item[1], item[0]))
    return [term.title() for term, _count in ordered[:limit]]


def build_study_notes(transcript: str, concepts: list[dict[str, Any]] | None = None, objectives: list[str] | None = None) -> dict[str, Any]:
    """Build a compact study-notes payload from transcript text."""
    sentences = _sentences(transcript)
    top_terms = _top_terms(transcript, concepts=concepts, limit=6)
    objectives = objectives or []

    summary = " ".join(sentences[:3]) if sentences else "No transcript content available."
    key_points = []
    for sentence in sentences[:5]:
        cleaned = _clean(sentence)
        if cleaned and cleaned not in key_points:
            key_points.append(cleaned)

    glossary = []
    for term in top_terms:
        sentence = next((item for item in sentences if term.lower() in item.lower()), None)
        glossary.append({"term": term, "definition": _clean(sentence)[:180] if sentence else f"Key idea related to {term}"})

    flashcards = []
    for index, term in enumerate(top_terms[:5]):
        clue = next((item for item in key_points if term.lower() in item.lower()), summary)
        flashcards.append({"front": f"What is {term}?", "back": clue[:180] or summary[:180], "order": index + 1})

    outline = [{"heading": "Overview", "bullets": [summary[:240]]}]
    if objectives:
        outline.append({"heading": "Learning Objectives", "bullets": objectives[:5]})
    if key_points:
        outline.append({"heading": "Key Points", "bullets": key_points[:6]})

    cornell = {
        "cue_column": top_terms[:6],
        "notes": key_points[:8],
        "summary": summary[:600],
    }

    return {
        "summary": summary[:700],
        "outline": outline,
        "cornell": cornell,
        "glossary": glossary,
        "flashcards": flashcards,
        "key_points": key_points[:8],
        "key_terms": top_terms,
        "practice_problems": [f"Explain {term} in your own words" for term in top_terms[:5]],
    }
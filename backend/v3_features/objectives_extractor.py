"""Learning objectives extraction helpers for v3.

These helpers turn transcript text into a small structured objectives payload
that can be rendered directly in the frontend and used by study tooling.
"""
from __future__ import annotations

from typing import Any
import re


_BLOOM_LEVELS = [
    ("remember", ["remember", "recall", "list", "name", "identify", "define"]),
    ("understand", ["understand", "explain", "describe", "summarize", "discuss"]),
    ("apply", ["apply", "use", "solve", "practice", "implement", "demonstrate"]),
    ("analyze", ["analyze", "compare", "contrast", "differentiate", "break down"]),
    ("evaluate", ["evaluate", "judge", "critique", "assess", "verify"]),
    ("create", ["create", "design", "build", "develop", "compose", "plan"]),
]


def _sentences(text: str) -> list[str]:
    return [sentence.strip() for sentence in re.split(r"(?<=[.?!])\s+|\n+", text or "") if sentence.strip()]


def _clean_sentence(sentence: str) -> str:
    return re.sub(r"\s+", " ", sentence).strip().rstrip(".?!")


def extract_stated_objectives(transcript: str) -> list[str]:
    """Extract explicitly stated objectives from transcript text."""
    objectives: list[str] = []
    for sentence in _sentences(transcript):
        lowered = sentence.lower()
        if any(token in lowered for token in ["we will", "you will", "in this lesson", "today we", "this video will", "our goal"]):
            cleaned = _clean_sentence(sentence)
            if cleaned and cleaned not in objectives:
                objectives.append(cleaned[:160])
    return objectives


def infer_implicit_objectives(content: str, concepts: list[dict[str, Any]] | None = None) -> list[str]:
    """Infer objectives from the main concepts when the speaker does not state them directly."""
    inferred: list[str] = []
    concept_names = [str(concept.get("name", "")).strip() for concept in concepts or [] if str(concept.get("name", "")).strip()]
    for name in concept_names[:5]:
        inferred.append(f"Understand the role of {name}")

    if not inferred:
        focus_sentences = [sentence for sentence in _sentences(content) if len(sentence.split()) > 5][:3]
        for sentence in focus_sentences:
            cleaned = _clean_sentence(sentence)
            if cleaned:
                inferred.append(f"Understand how {cleaned[0].lower() + cleaned[1:]}" if len(cleaned) > 1 else cleaned)

    return inferred or ["Understand the main ideas covered in the lesson."]


def map_to_blooms_taxonomy(objectives: list[str]) -> list[str]:
    """Assign a Bloom's taxonomy label to each objective."""
    mapped: list[str] = []
    for objective in objectives:
        lowered = objective.lower()
        level = "understand"
        for label, keywords in _BLOOM_LEVELS:
            if any(keyword in lowered for keyword in keywords):
                level = label
                break
        mapped.append(level)
    return mapped


def generate_learning_statements(objectives: list[str]) -> list[str]:
    """Convert objective text into concise learner-facing statements."""
    statements: list[str] = []
    for objective in objectives:
        cleaned = _clean_sentence(objective)
        if not cleaned:
            continue
        if cleaned.lower().startswith(("you will", "we will", "students will")):
            statements.append(cleaned)
        else:
            statements.append(f"You will learn how to {cleaned[0].lower() + cleaned[1:]}")
    return statements


def track_objective_coverage(content: str, objectives: list[str]) -> list[float]:
    """Estimate how much of each objective is covered in the transcript."""
    lowered = content.lower()
    coverage: list[float] = []
    for objective in objectives:
        keywords = [token for token in re.findall(r"[A-Za-z][A-Za-z0-9_'-]+", objective.lower()) if len(token) > 3]
        if not keywords:
            coverage.append(0.3)
            continue
        hits = sum(1 for keyword in keywords if keyword in lowered)
        coverage.append(round(min(1.0, max(0.2, hits / max(3, len(keywords)))), 2))
    return coverage


def create_objectives_checklist(objectives: list[str], blooms: list[str], coverage: list[float]) -> list[dict[str, Any]]:
    """Build a checklist payload that the frontend can render directly."""
    checklist: list[dict[str, Any]] = []
    for index, objective in enumerate(objectives):
        checklist.append(
            {
                "objective": objective,
                "bloom_level": blooms[index] if index < len(blooms) else "understand",
                "coverage_percent": round((coverage[index] if index < len(coverage) else 0.0) * 100, 1),
                "checked": False,
            }
        )
    return checklist


def build_objectives_profile(transcript: str, concepts: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Create the full objectives payload used by the v3 endpoint."""
    stated = extract_stated_objectives(transcript)
    implicit = infer_implicit_objectives(transcript, concepts)
    objectives = stated or implicit
    blooms = map_to_blooms_taxonomy(objectives)
    statements = generate_learning_statements(objectives)
    coverage = track_objective_coverage(transcript, objectives)
    return {
        "objectives": objectives,
        "learning_statements": statements,
        "blooms": blooms,
        "coverage": coverage,
        "checklist": create_objectives_checklist(objectives, blooms, coverage),
    }
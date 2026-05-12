"""Educational content detection helpers (v3 stub).

These functions use lightweight heuristics first so the app can ship without
waiting on a full LLM pipeline for every endpoint.
"""
from typing import List, Dict, Any
import re


def detect_educational_sections(transcript: str) -> List[Dict[str, Any]]:
    """Return list of detected educational sections with start/end timestamps."""
    if not transcript or not transcript.strip():
        return []
    words = transcript.split()
    chunk_size = max(80, min(240, max(1, len(words) // 3)))
    sections = []
    for index in range(0, len(words), chunk_size):
        section_words = words[index:index + chunk_size]
        section_text = " ".join(section_words)
        start = float(index)
        end = float(min(len(words), index + chunk_size))
        sections.append({
            "start": start,
            "end": end,
            "confidence": min(0.95, 0.45 + min(0.4, len(section_words) / 500.0)),
            "title": f"Section {len(sections) + 1}",
            "text": section_text,
        })
    return sections


def score_educational_relevance(text: str) -> int:
    """Return a 0-100 heuristic educational relevance score."""
    if not text:
        return 0
    text_l = text.lower()
    score = 0
    if any(token in text_l for token in ["lesson", "teach", "explain", "example", "definition", "concept", "step", "lecture"]):
        score += 35
    if any(token in text_l for token in ["because", "therefore", "first", "second", "let's", "we will", "in summary"]):
        score += 20
    score += min(30, len(text.split()) // 25)
    if len(text.split()) > 120:
        score += 15
    return max(0, min(100, score))


def identify_teaching_patterns(transcript: str) -> str:
    """Detect a teaching pattern: lecture/demo/discussion/Q&A."""
    text = (transcript or "").lower()
    if any(token in text for token in ["question", "q&a", "ask", "student"]):
        return "q&a"
    if any(token in text for token in ["demo", "show you", "watch this", "example", "here's how"]):
        return "demo"
    if any(token in text for token in ["discussion", "debate", "consider", "compare"]):
        return "discussion"
    return "lecture"


def extract_implied_objectives(content: str) -> List[str]:
    """Return a list of inferred learning objectives (stub)."""
    if not content:
        return []
    sentences = re.split(r"[\.\n\?]", content)
    objectives = []
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        lowered = sentence.lower()
        if any(token in lowered for token in ["learn", "understand", "know", "show", "demonstrate", "explain", "apply"]):
            objectives.append(sentence[:120])
    if not objectives:
        objectives = ["Understand the main idea", "Recognize key concepts"]
    return objectives[:6]


def filter_non_educational_segments(transcript: str) -> str:
    """Return a filtered transcript with obvious non-educational lines removed."""
    if not transcript:
        return transcript
    lines = []
    for line in transcript.splitlines():
        lowered = line.lower().strip()
        if not lowered:
            continue
        if lowered.startswith(("subscribe", "like and subscribe", "intro music", "outro music")):
            continue
        lines.append(line)
    return "\n".join(lines) if lines else transcript

"""Smart timestamping algorithms (v3 stub).

Provide helpers to detect concept transitions and teaching moments.
"""
from typing import List, Dict, Any


def detect_concept_transitions(transcript_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return candidate transition timestamps based on text changes."""
    results = []
    previous_keywords = set()
    for c in transcript_chunks[:20]:
        text = str(c.get("text") or "")
        words = {word.strip(".,:;!?()[]{}").lower() for word in text.split() if len(word) > 4}
        new_keywords = words - previous_keywords
        if new_keywords:
            results.append({
                "timestamp": float(c.get("start", c.get("start_time", 0))),
                "label": text[:80] or "Teaching moment",
                "reason": "new_concept_introduced",
                "confidence": min(0.95, 0.45 + len(new_keywords) / 25.0),
            })
        previous_keywords |= words
    return results


def identify_teaching_moments(transcript_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return teaching moments; stub reuses detect_concept_transitions."""
    return detect_concept_transitions(transcript_chunks)


def generate_smart_chapters(transcript_chunks: List[Dict[str, Any]], min_length: int = 300, max_length: int = 900) -> List[Dict[str, Any]]:
    """Create simple chapter markers by grouping chunks until min_length reached."""
    chapters = []
    if not transcript_chunks:
        return chapters
    current_start = float(transcript_chunks[0].get('start', transcript_chunks[0].get('start_time', 0)) or 0)
    buffer_words = 0
    for i, c in enumerate(transcript_chunks):
        buffer_words += len(str(c.get("text") or "").split())
        if buffer_words >= min_length or i == len(transcript_chunks) - 1:
            end = float(c.get('end', c.get('end_time', current_start + max_length)) or 0)
            chapters.append({"start": current_start, "end": end, "label": f"Chapter {len(chapters)+1}", "confidence": 0.7})
            current_start = end
            buffer_words = 0
    return chapters


def label_chapters_by_concept(chapters: List[Dict[str, Any]], concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    labeled = []
    concept_names = [str(concept.get("name", "Concept")) for concept in concepts] or ["Concept"]
    for index, chapter in enumerate(chapters):
        chapter_copy = dict(chapter)
        chapter_copy["label"] = concept_names[min(index, len(concept_names) - 1)]
        labeled.append(chapter_copy)
    return labeled


def create_checkpoint_markers(chapters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [{"timestamp": chapter.get("start", 0), "label": chapter.get("label", "Checkpoint"), "type": "quiz_checkpoint"} for chapter in chapters]

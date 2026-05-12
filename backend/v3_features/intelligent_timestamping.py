"""Smart timestamping algorithms for v3 educational analysis.

These heuristics look for concept changes, teaching cues, and chapter-sized
blocks so timestamp output is more useful even without an LLM pass.
"""
from typing import List, Dict, Any


_TEACHING_CUES = {
    "remember",
    "important",
    "key point",
    "the takeaway",
    "for example",
    "notice",
    "in summary",
    "first",
    "next",
    "finally",
}


def _chunk_start(chunk: Dict[str, Any], fallback: float) -> float:
    return float(chunk.get("start", chunk.get("start_time", fallback)) or fallback)


def _chunk_end(chunk: Dict[str, Any], fallback: float) -> float:
    return float(chunk.get("end", chunk.get("end_time", fallback)) or fallback)


def _keywords(text: str) -> set[str]:
    return {
        word.strip(".,:;!?()[]{}\"'`").lower()
        for word in str(text or "").split()
        if len(word.strip(".,:;!?()[]{}\"'`")) > 4
    }


def detect_concept_transitions(transcript_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return candidate transition timestamps based on text changes."""
    results = []
    previous_keywords = set()
    for index, c in enumerate(transcript_chunks[:40]):
        text = str(c.get("text") or "")
        words = _keywords(text)
        new_keywords = words - previous_keywords
        cue_hit = any(cue in text.lower() for cue in _TEACHING_CUES)
        if index == 0 or new_keywords or cue_hit:
            results.append({
                "timestamp": _chunk_start(c, 0.0),
                "label": text[:80] or "Teaching moment",
                "reason": "new_concept_introduced" if new_keywords else "teaching_cue" if cue_hit else "chapter_start",
                "confidence": min(0.97, 0.5 + (len(new_keywords) / 20.0) + (0.12 if cue_hit else 0.0)),
            })
        previous_keywords |= words
    return results


def identify_teaching_moments(transcript_chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return teaching moments; stub reuses detect_concept_transitions."""
    moments = []
    for item in detect_concept_transitions(transcript_chunks):
        if item.get("reason") in {"new_concept_introduced", "teaching_cue"}:
            moments.append(item)
    return moments


def generate_smart_chapters(transcript_chunks: List[Dict[str, Any]], min_length: int = 300, max_length: int = 900) -> List[Dict[str, Any]]:
    """Create simple chapter markers by grouping chunks until min_length reached."""
    chapters = []
    if not transcript_chunks:
        return chapters
    current_start = _chunk_start(transcript_chunks[0], 0.0)
    buffer_words = 0
    chapter_texts: list[str] = []
    for i, c in enumerate(transcript_chunks):
        chunk_text = str(c.get("text") or "")
        chapter_texts.append(chunk_text)
        buffer_words += len(chunk_text.split())
        if buffer_words >= min_length or i == len(transcript_chunks) - 1:
            end = _chunk_end(c, current_start + max_length)
            text_blob = " ".join(chapter_texts).strip()
            label = text_blob[:80] if text_blob else f"Chapter {len(chapters) + 1}"
            chapters.append({"start": current_start, "end": end, "label": label, "confidence": 0.72 if buffer_words >= min_length else 0.6})
            current_start = end
            buffer_words = 0
            chapter_texts = []
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
    return [
        {
            "timestamp": chapter.get("start", 0),
            "label": chapter.get("label", "Checkpoint"),
            "type": "quiz_checkpoint",
            "chapter_end": chapter.get("end", chapter.get("start", 0)),
        }
        for chapter in chapters
    ]

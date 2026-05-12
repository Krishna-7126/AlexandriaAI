from __future__ import annotations

import json
import re
from typing import Any

from .gemini_client import generate_text, gemini_available
from .summary_helper import extractive_summary
from .transcript_store import get_chunks
from .queue import cache_get as redis_cache_get, cache_set as redis_cache_set, enqueue_job, is_enabled as redis_enabled

_analysis_cache: dict[tuple[Any, ...], dict[str, Any]] = {}

_STOPWORDS = {
    "the", "and", "is", "in", "it", "of", "to", "a", "that", "this", "for", "on", "with",
    "as", "are", "was", "be", "by", "an", "or", "from", "at", "which", "but", "we", "you",
    "they", "their", "our", "your", "i", "he", "she", "them", "his", "her", "about", "into",
}

_EDU_KEYWORDS = {
    "learn", "understand", "explain", "concept", "example", "lesson", "tutorial", "definition",
    "objective", "practice", "step", "steps", "because", "how", "why", "theory", "algorithm",
    "formula", "proof", "compare", "analysis", "discussion", "demo", "exercise", "summary",
    "key point", "key points", "important", "remember",
}


def _normalize_chunk(metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "text": metadata.get("text", ""),
        "start": metadata.get("start", metadata.get("start_time", 0)) or 0,
        "end": metadata.get("end", metadata.get("end_time", 0)) or 0,
        "source": metadata.get("source", "unknown"),
        "method": metadata.get("method", "unknown"),
        "quality_score": metadata.get("quality_score", "unknown"),
        "quality_warnings": metadata.get("quality_warnings", ""),
        "word_count": metadata.get("word_count", 0) or 0,
        "chunk_count": metadata.get("chunk_count", 0) or 0,
        "unique_ratio": metadata.get("unique_ratio", 0.0) or 0.0,
    }


def _load_chunks(video_id: str) -> list[dict[str, Any]]:
    chunks = [_normalize_chunk(chunk) for chunk in get_chunks(video_id)]
    return sorted(chunks, key=lambda chunk: chunk.get("start", 0))


def _cache_key(video_id: str, chunks: list[dict[str, Any]], kind: str = "analysis") -> tuple[Any, ...]:
    last_end = int(max([chunk.get("end", 0) or 0 for chunk in chunks], default=0))
    text_size = sum(len(chunk.get("text", "")) for chunk in chunks)
    return (kind, video_id, len(chunks), last_end, text_size)


def _clip(text: str, limit: int = 240) -> str:
    text = " ".join(str(text or "").split())
    if len(text) <= limit:
        return text
    clipped = text[:limit].rsplit(" ", 1)[0].strip()
    return clipped.rstrip(".,;:") + "."


def _normalize_timestamp(value: Any) -> float:
    numeric = float(value or 0)
    return round(numeric / 1000.0, 3) if numeric > 10000 else round(numeric, 3)


def _clean_text(text: str) -> str:
    text = re.sub(r"<\d{2}:\d{2}:\d{2}\.\d{3}>", " ", str(text or ""))
    text = re.sub(r"</?c(?:\.[^>]*)?>", " ", text)
    text = re.sub(r"</?[^>]+>", " ", text)
    text = re.sub(r"\{\\an\d+\}", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _coerce_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?", "", candidate, flags=re.IGNORECASE).strip()
        candidate = re.sub(r"```$", "", candidate).strip()

    attempts = [candidate]
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start != -1 and end != -1 and end > start:
        attempts.append(candidate[start : end + 1])

    for attempt in attempts:
        try:
            parsed = json.loads(attempt)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue
    return None


def _make_context(chunks: list[dict[str, Any]], limit: int = 18) -> str:
    lines = []
    for chunk in chunks[:limit]:
        start = float(chunk.get("start", 0) or 0)
        end = float(chunk.get("end", 0) or 0)
        lines.append(f"[{start:.2f}-{end:.2f}] {_clean_text(chunk.get('text', ''))}")
    return "\n".join(lines)


def _score_educationality(text: str) -> int:
    lowered = text.lower()
    score = 0
    for keyword in _EDU_KEYWORDS:
        if keyword in lowered:
            score += 8
    question_marks = lowered.count("?")
    if question_marks:
        score += min(15, question_marks * 3)
    if len(lowered.split()) > 100:
        score += 10
    if any(marker in lowered for marker in ["let's learn", "today we", "in this lecture", "in this video", "for example"]):
        score += 15
    return max(0, min(100, score))


def _infer_teaching_mode(text: str) -> str:
    lowered = text.lower()
    if any(marker in lowered for marker in ["step by step", "how to", "walk through", "follow along"]):
        return "tutorial"
    if any(marker in lowered for marker in ["demo", "demonstrate", "watch this", "here's how"]):
        return "demo"
    if any(marker in lowered for marker in ["question", "q&a", "discussion", "ask"]):
        return "discussion"
    if any(marker in lowered for marker in ["today we", "in this lecture", "let's learn", "we will cover"]):
        return "lecture"
    return "mixed"


def _group_chunks(chunks: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    if not chunks:
        return []

    groups: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    last_end = float(chunks[0].get("start", 0) or 0)

    for chunk in chunks:
        start = float(chunk.get("start", 0) or 0)
        end = float(chunk.get("end", 0) or 0)
        if current and (start - last_end > 90 or len(current) >= 5):
            groups.append(current)
            current = []
        current.append(chunk)
        last_end = max(last_end, end)

    if current:
        groups.append(current)
    return groups


def _fallback_concepts(chunks: list[dict[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    concepts: list[dict[str, Any]] = []
    for group in _group_chunks(chunks):
        group_text = " ".join(_clean_text(chunk.get("text", "")) for chunk in group if chunk.get("text"))
        if not group_text:
            continue
        title = _clip(extractive_summary(group_text, num_sentences=1), 72)
        if not title:
            continue
        concepts.append(
            {
                "name": title,
                "timestamp": _normalize_timestamp(group[0].get("start", 0)),
                "importance": 0.55,
                "why_it_matters": _clip(extractive_summary(group_text, num_sentences=2), 180),
            }
        )
        if len(concepts) >= limit:
            break
    return concepts


def _fallback_timestamps(chunks: list[dict[str, Any]], concepts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    timestamps: list[dict[str, Any]] = []
    groups = _group_chunks(chunks)
    for index, group in enumerate(groups):
        group_text = " ".join(_clean_text(chunk.get("text", "")) for chunk in group if chunk.get("text"))
        if not group_text:
            continue
        label = _clip(extractive_summary(group_text, num_sentences=1), 64)
        if concepts and index < len(concepts):
            label = concepts[index].get("name", label)
        timestamps.append(
            {
                "timestamp": _normalize_timestamp(group[0].get("start", 0)),
                "label": label or f"Concept {index + 1}",
                "reason": _clip(extractive_summary(group_text, num_sentences=2), 140),
            }
        )
    return timestamps[:10]


def _fallback_objectives(text: str) -> list[str]:
    summary = extractive_summary(text, num_sentences=2)
    if not summary:
        return ["Understand the main ideas covered in the video."]
    parts = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", summary) if sentence.strip()]
    objectives = []
    for part in parts:
        cleaned = part.rstrip(".")
        if cleaned:
            objectives.append(f"Understand how {cleaned[0].lower() + cleaned[1:]}")
    return objectives[:4] or ["Understand the core educational content."]


def _fallback_summary_levels(text: str) -> dict[str, str]:
    base = _clip(extractive_summary(text, num_sentences=4), 900)
    eli5 = _clip(f"In simple terms, {extractive_summary(text, num_sentences=1)}", 500)
    expert = _clip(extractive_summary(text, num_sentences=6), 1100)
    tldr = _clip(extractive_summary(text, num_sentences=1), 260)
    if not eli5:
        eli5 = "This video explains a topic in a simple, step-by-step way."
    if not base:
        base = "A concise summary is not available yet."
    if not expert:
        expert = base
    if not tldr:
        tldr = base
    return {
        "tldr": tldr,
        "eli5": eli5,
        "standard": base,
        "expert": expert,
    }


def _build_analysis_prompt(chunks: list[dict[str, Any]]) -> str:
    context = _make_context(chunks, limit=18)
    return (
        "You are Alexandria, an expert educational AI tutor.\n"
        "Analyze the transcript for teaching value, not just wording.\n"
        "Return ONLY valid JSON with these keys: educational_score, teaching_mode, audience_level, summary_levels, learning_objectives, key_concepts, smart_timestamps, qa_guidance.\n"
        "summary_levels must contain tldr, eli5, standard, expert.\n"
        "key_concepts must be an array of objects with name, timestamp, importance, why_it_matters.\n"
        "smart_timestamps must be an array of objects with timestamp, label, reason.\n"
        "Use timestamps from the transcript context and focus on educational transitions.\n\n"
        f"TRANSCRIPT:\n{context}\n\n"
        "JSON:"
    )


def analyze_educational_content(video_id: str) -> dict[str, Any]:
    # Try Redis cache first (if available)
    try:
        cached = redis_cache_get(f"v3:educational:{video_id}") if redis_enabled() else None
    except Exception:
        cached = None
    if cached:
        return cached

    chunks = _load_chunks(video_id)
    if not chunks:
        return {
            "video_id": video_id,
            "status": "no_data",
            "educational_score": 0,
            "teaching_mode": "unknown",
            "audience_level": "unknown",
            "summary_levels": _fallback_summary_levels(""),
            "learning_objectives": [],
            "key_concepts": [],
            "smart_timestamps": [{"timestamp": 0.0, "label": "Start", "reason": "No transcript data available."}],
            "qa_guidance": "No transcript data is available yet.",
        }

    cache_key = _cache_key(video_id, chunks, "analysis")
    cached = _analysis_cache.get(cache_key)
    if cached:
        return cached

    transcript_text = " ".join(_clean_text(chunk.get("text", "")) for chunk in chunks if chunk.get("text"))
    summary_levels = _fallback_summary_levels(transcript_text)
    learning_objectives = _fallback_objectives(transcript_text)
    concepts = _fallback_concepts(chunks)
    timestamps = _fallback_timestamps(chunks, concepts)

    analysis: dict[str, Any] = {
        "video_id": video_id,
        "status": "success",
        "educational_score": _score_educationality(transcript_text),
        "teaching_mode": _infer_teaching_mode(transcript_text),
        "audience_level": "intermediate" if len(transcript_text.split()) > 250 else "beginner",
        "summary_levels": summary_levels,
        "learning_objectives": learning_objectives,
        "key_concepts": concepts,
        "smart_timestamps": timestamps,
        "qa_guidance": "Ask for definitions, examples, comparisons, or how one idea leads to the next. Use the timestamps to jump to the most relevant teaching moment.",
        "transcript_length": len(transcript_text.split()),
        "chunk_count": len(chunks),
    }
    # If an LLM is available, prefer background processing via Redis + RQ
    if gemini_available():
        try:
            # If Redis & RQ are enabled, enqueue a background job and return a queued status
            if redis_enabled():
                # enqueue background task to run full analysis and cache result
                try:
                    enqueue_job(__import__('backend.tasks', fromlist=['run_educational_analysis']).tasks.run_educational_analysis, video_id, transcript_text)
                    analysis["status"] = "queued"
                except Exception:
                    # Fall back to immediate analysis if enqueue fails
                    prompt = _build_analysis_prompt(chunks)
                    raw = generate_text(prompt, temperature=0.2, max_output_tokens=1200)
                    parsed = _coerce_json(raw or "")
                    if parsed:
                        analysis = _merge_parsed_into_analysis(analysis, parsed)
                        analysis["status"] = "gemini"
            else:
                # No Redis: perform immediate LLM pass synchronously
                prompt = _build_analysis_prompt(chunks)
                raw = generate_text(prompt, temperature=0.2, max_output_tokens=1200)
                parsed = _coerce_json(raw or "")
                if parsed:
                    analysis = _merge_parsed_into_analysis(analysis, parsed)
                    analysis["status"] = "gemini"
        except Exception as exc:
            print(f"Educational analysis Gemini pass failed: {exc}")

    # Cache the fallback analysis so UI has quick access
    try:
        redis_cache_set(f"v3:educational:{video_id}", analysis, ttl=60 * 30)
    except Exception:
        pass

    _analysis_cache[cache_key] = analysis
    return analysis


def _merge_parsed_into_analysis(analysis: dict, parsed: dict) -> dict:
    """Helper to merge JSON-parsed LLM output into the analysis payload."""
    try:
        analysis["educational_score"] = int(parsed.get("educational_score", analysis.get("educational_score")) or analysis.get("educational_score"))
        analysis["teaching_mode"] = str(parsed.get("teaching_mode", analysis.get("teaching_mode")) or analysis.get("teaching_mode"))
        analysis["audience_level"] = str(parsed.get("audience_level", analysis.get("audience_level")) or analysis.get("audience_level"))

        parsed_levels = parsed.get("summary_levels") if isinstance(parsed.get("summary_levels"), dict) else {}
        for key in ("tldr", "eli5", "standard", "expert"):
            value = parsed_levels.get(key) if isinstance(parsed_levels, dict) else None
            if value:
                analysis["summary_levels"][key] = _clip(str(value), 1200)

        objectives = parsed.get("learning_objectives")
        if isinstance(objectives, list) and objectives:
            analysis["learning_objectives"] = [str(item).strip() for item in objectives if str(item).strip()][:8]

        parsed_concepts = parsed.get("key_concepts")
        if isinstance(parsed_concepts, list) and parsed_concepts:
            cleaned_concepts = []
            for item in parsed_concepts[:8]:
                if not isinstance(item, dict):
                    continue
                cleaned_concepts.append(
                    {
                        "name": str(item.get("name", "")).strip() or "Concept",
                        "timestamp": round(float(item.get("timestamp", 0) or 0), 3),
                        "importance": float(item.get("importance", 0.5) or 0.5),
                        "why_it_matters": _clip(str(item.get("why_it_matters", "")).strip(), 180),
                    }
                )
            if cleaned_concepts:
                analysis["key_concepts"] = cleaned_concepts

        parsed_timestamps = parsed.get("smart_timestamps")
        if isinstance(parsed_timestamps, list) and parsed_timestamps:
            cleaned_timestamps = []
            for item in parsed_timestamps[:10]:
                if not isinstance(item, dict):
                    continue
                cleaned_timestamps.append(
                    {
                        "timestamp": round(float(item.get("timestamp", 0) or 0), 3),
                        "label": str(item.get("label", "")).strip() or "Teaching moment",
                        "reason": _clip(str(item.get("reason", "")).strip(), 180),
                    }
                )
            if cleaned_timestamps:
                analysis["smart_timestamps"] = cleaned_timestamps

        guidance = parsed.get("qa_guidance")
        if guidance:
            analysis["qa_guidance"] = _clip(str(guidance), 360)
    except Exception:
        pass
    return analysis


def get_summary_levels(video_id: str) -> dict[str, str]:
    return analyze_educational_content(video_id).get("summary_levels", _fallback_summary_levels(""))


def get_smart_topics(video_id: str) -> list[dict[str, Any]]:
    analysis = analyze_educational_content(video_id)
    topics: list[dict[str, Any]] = []
    for index, concept in enumerate(analysis.get("key_concepts", [])):
        if not isinstance(concept, dict):
            continue
        topics.append(
            {
                "topic": concept.get("name", f"Concept {index + 1}"),
                "summary": concept.get("why_it_matters", "") or analysis.get("summary_levels", {}).get("standard", ""),
                "timestamp": concept.get("timestamp", 0),
            }
        )
    return topics[:6]


def get_smart_timestamps(video_id: str) -> list[dict[str, Any]]:
    analysis = analyze_educational_content(video_id)
    timestamps = analysis.get("smart_timestamps", [])
    if timestamps:
        return timestamps

    chunks = _load_chunks(video_id)
    return _fallback_timestamps(chunks, _fallback_concepts(chunks))


def get_recent_learning_summary(video_id: str, minutes: int = 5) -> dict[str, Any]:
    chunks = _load_chunks(video_id)
    if not chunks:
        return {"summary": "No content available", "timestamp": 0}

    last_end = float(chunks[-1].get("end", 0) or 0)
    start_time = last_end - (minutes * 60)
    relevant_chunks = [chunk for chunk in chunks if float(chunk.get("end", 0) or 0) > start_time]
    if not relevant_chunks:
        relevant_chunks = chunks[-3:]

    relevant_text = " ".join(_clean_text(chunk.get("text", "")) for chunk in relevant_chunks if chunk.get("text"))
    analysis = analyze_educational_content(video_id)
    summary = extractive_summary(relevant_text, num_sentences=3)

    if gemini_available() and relevant_text:
        try:
            prompt = (
                f"Summarize the last {minutes} minutes as a learning-focused recap. "
                "Focus on the ideas taught, not the exact wording. Return 2-4 concise sentences.\n\n"
                f"Teaching guidance:\n{analysis.get('qa_guidance', '')}\n\n"
                f"Transcript:\n{_make_context(relevant_chunks, limit=12)}\n\nSummary:"
            )
            gemini_summary = generate_text(prompt, temperature=0.2, max_output_tokens=220)
            if gemini_summary:
                summary = gemini_summary
        except Exception as exc:
            print(f"Educational recent summary failed: {exc}")

    return {
        "summary": _clip(summary, 700),
        "timestamp": _normalize_timestamp(relevant_chunks[0].get("start", 0)),
    }


def build_qa_bundle(video_id: str, question: str, history: list[dict[str, Any]] | None = None, limit: int = 4) -> dict[str, Any]:
    chunks = _load_chunks(video_id)
    analysis = analyze_educational_content(video_id)
    if not chunks:
        return {"analysis": analysis, "chunks": [], "context": ""}

    question_terms = {term for term in re.findall(r"\w+", (question or "").lower()) if len(term) > 2}
    concept_terms = set()
    for concept in analysis.get("key_concepts", []):
        if isinstance(concept, dict):
            concept_terms.update(re.findall(r"\w+", str(concept.get("name", "")).lower()))

    scored: list[tuple[float, int, dict[str, Any]]] = []
    for index, chunk in enumerate(chunks):
        text = _clean_text(chunk.get("text", ""))
        if not text:
            continue
        words = set(re.findall(r"\w+", text.lower()))
        overlap = len(question_terms & words)
        concept_overlap = len(concept_terms & words)
        proximity_bonus = 1.0 if index < 3 else 0.0
        score = overlap * 2.5 + concept_overlap * 1.5 + proximity_bonus
        if score > 0:
            scored.append((score, index, chunk))

    if not scored:
        scored = [(1.0, 0, chunks[0])]

    scored.sort(key=lambda item: item[0], reverse=True)
    selected_indices = sorted({max(0, min(len(chunks) - 1, item[1])) for item in scored[:limit]})

    expanded_indices = set(selected_indices)
    for index in list(selected_indices):
        if index - 1 >= 0:
            expanded_indices.add(index - 1)
        if index + 1 < len(chunks):
            expanded_indices.add(index + 1)

    selected_chunks = [chunks[index] for index in sorted(expanded_indices)]
    context_lines = []
    for chunk in selected_chunks[:limit + 2]:
        start = float(chunk.get("start", 0) or 0)
        end = float(chunk.get("end", 0) or 0)
        context_lines.append(f"[{start:.2f}-{end:.2f}] {_clean_text(chunk.get('text', ''))}")

    history_lines = []
    for item in (history or [])[-4:]:
        history_lines.append(f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}")

    return {
        "analysis": analysis,
        "chunks": selected_chunks,
        "context": "\n".join(context_lines),
        "history": "\n\n".join(history_lines),
    }

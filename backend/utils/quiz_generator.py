from __future__ import annotations

import json
import re
from typing import Any

from .education_ai import analyze_educational_content
from .summary_helper import extractive_summary
from .gemini_client import generate_text, gemini_available


def _sanitize_options(options: list[str]) -> list[str]:
    cleaned = []
    for option in options:
        text = re.sub(r"\s+", " ", str(option or "")).strip()
        if text and text not in cleaned:
            cleaned.append(text)
    return cleaned[:4]


def _fallback_question(concept: dict[str, Any], index: int) -> dict[str, Any]:
    name = str(concept.get("name", f"Concept {index + 1}")).strip() or f"Concept {index + 1}"
    why = str(concept.get("why_it_matters", "")).strip() or "It connects to the main lesson."
    timestamp = round(float(concept.get("timestamp", 0) or 0), 3)
    options = _sanitize_options([
        name,
        f"A smaller part of {name}",
        "A completely unrelated idea",
        "A random example",
    ])

    return {
        "id": f"q_{index + 1}",
        "type": "mcq",
        "concept": name,
        "timestamp": timestamp,
        "question": f"Which statement best matches the concept '{name}'?",
        "options": options,
        "answer": options[0] if options else name,
        "explanation": why,
    }


def _build_quiz_prompt(analysis: dict[str, Any], num_questions: int) -> str:
    concepts = analysis.get("key_concepts", [])[: max(3, num_questions)]
    objectives = analysis.get("learning_objectives", [])[:4]
    concept_lines = []
    for concept in concepts:
        if not isinstance(concept, dict):
            continue
        concept_lines.append(
            f"- {concept.get('name', 'Concept')} @ {concept.get('timestamp', 0)}s: {concept.get('why_it_matters', '')}"
        )

    objective_lines = "\n".join(f"- {objective}" for objective in objectives) or "- Understand the main ideas"
    return (
        "You are Alexandria, an educational quiz generator.\n"
        f"Create {num_questions} strong quiz questions from the transcript concepts below.\n"
        "Focus on understanding, not memorization. Use only concepts from the transcript context.\n"
        "Return ONLY valid JSON as an array of objects with keys: type, concept, question, options, answer, explanation, timestamp.\n"
        "Types should be chosen from mcq, true_false, fill_blank, short_answer.\n"
        "For mcq, provide exactly 4 options. For true_false, use two options: True and False.\n\n"
        f"Learning objectives:\n{objective_lines}\n\n"
        f"Key concepts:\n" + ("\n".join(concept_lines) if concept_lines else "- Main educational concepts from the transcript") + "\n\n"
        "JSON:"
    )


def _coerce_quiz(text: str) -> list[dict[str, Any]] | None:
    if not text:
        return None

    candidate = text.strip()
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?", "", candidate, flags=re.IGNORECASE).strip()
        candidate = re.sub(r"```$", "", candidate).strip()

    attempts = [candidate]
    start = candidate.find("[")
    end = candidate.rfind("]")
    if start != -1 and end != -1 and end > start:
        attempts.append(candidate[start : end + 1])

    for attempt in attempts:
        try:
            parsed = json.loads(attempt)
            if isinstance(parsed, list):
                cleaned = []
                for item in parsed:
                    if not isinstance(item, dict):
                        continue
                    options = item.get("options")
                    if isinstance(options, list):
                        options = _sanitize_options([str(option) for option in options])
                    else:
                        options = []
                    cleaned.append(
                        {
                            "type": str(item.get("type", "mcq")).strip() or "mcq",
                            "concept": str(item.get("concept", "")).strip(),
                            "question": str(item.get("question", "")).strip(),
                            "options": options,
                            "answer": str(item.get("answer", "")).strip(),
                            "explanation": str(item.get("explanation", "")).strip(),
                            "timestamp": round(float(item.get("timestamp", 0) or 0), 3),
                        }
                    )
                return cleaned
        except Exception:
            continue
    return None


def generate_quiz(video_id: str, num_questions: int = 5) -> dict[str, Any]:
    analysis = analyze_educational_content(video_id)
    concepts = [concept for concept in analysis.get("key_concepts", []) if isinstance(concept, dict)]

    if not concepts:
        return {
            "video_id": video_id,
            "status": "no_data",
            "questions": [],
            "message": "No educational concepts found yet. Generate analysis first.",
        }

    fallback_questions = [_fallback_question(concept, index) for index, concept in enumerate(concepts[:num_questions])]
    questions = fallback_questions
    status = "fallback"

    if gemini_available():
        try:
            raw = generate_text(_build_quiz_prompt(analysis, num_questions), temperature=0.25, max_output_tokens=900)
            parsed = _coerce_quiz(raw or "")
            if parsed:
                for index, item in enumerate(parsed[:num_questions]):
                    if not item.get("question"):
                        continue
                    if item.get("type") == "mcq" and len(item.get("options", [])) < 4:
                        item["options"] = _sanitize_options(
                            list(item.get("options", [])) + ["None of the above", "Not enough information"]
                        )
                    if not item.get("answer") and item.get("options"):
                        item["answer"] = item["options"][0]
                    if not item.get("timestamp") and index < len(concepts):
                        item["timestamp"] = round(float(concepts[index].get("timestamp", 0) or 0), 3)
                questions = parsed[:num_questions] or fallback_questions
                status = "gemini"
        except Exception as exc:
            print(f"Quiz generation Gemini pass failed: {exc}")

    return {
        "video_id": video_id,
        "status": status,
        "educational_score": analysis.get("educational_score", 0),
        "teaching_mode": analysis.get("teaching_mode", "mixed"),
        "questions": questions[:num_questions],
        "question_count": min(num_questions, len(questions)),
    }


def _segment_concepts_from_text(transcript_text: str, limit: int = 6) -> list[dict[str, Any]]:
    sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", transcript_text) if sentence.strip()]
    concepts: list[dict[str, Any]] = []
    for index, sentence in enumerate(sentences[:limit]):
        short_name = _sanitize_options([extractive_summary(sentence, num_sentences=1) or sentence[:80]])[0]
        concepts.append(
            {
                "name": short_name or f"Segment {index + 1}",
                "timestamp": float(index * 30),
                "why_it_matters": extractive_summary(sentence, num_sentences=2) or sentence,
            }
        )
    return concepts


def generate_quiz_from_text(transcript_text: str, num_questions: int = 5, title_hint: str | None = None) -> dict[str, Any]:
    transcript_text = re.sub(r"\s+", " ", str(transcript_text or "")).strip()
    if not transcript_text:
        return {
            "status": "no_data",
            "questions": [],
            "message": "No transcript content available for this segment.",
        }

    concepts = _segment_concepts_from_text(transcript_text, limit=max(3, num_questions))
    fallback_questions = [_fallback_question(concept, index) for index, concept in enumerate(concepts[:num_questions])]
    questions = fallback_questions
    status = "fallback"

    if gemini_available():
        prompt = (
            "You are Alexandria, an educational quiz generator.\n"
            f"Create {num_questions} quiz questions from this transcript segment{f' ({title_hint})' if title_hint else ''}.\n"
            "Focus only on the supplied segment. Use only concepts present in the transcript.\n"
            "Return ONLY valid JSON as an array of objects with keys: type, concept, question, options, answer, explanation, timestamp.\n"
            "Types should be chosen from mcq, true_false, fill_blank, short_answer.\n"
            "For mcq, provide exactly 4 options. For true_false, use two options: True and False.\n\n"
            f"TRANSCRIPT SEGMENT:\n{transcript_text[:4000]}\n\n"
            "JSON:"
        )
        try:
            raw = generate_text(prompt, temperature=0.25, max_output_tokens=900)
            parsed = _coerce_quiz(raw or "")
            if parsed:
                for index, item in enumerate(parsed[:num_questions]):
                    if not item.get("question"):
                        continue
                    if item.get("type") == "mcq" and len(item.get("options", [])) < 4:
                        item["options"] = _sanitize_options(
                            list(item.get("options", [])) + ["None of the above", "Not enough information"]
                        )
                    if not item.get("answer") and item.get("options"):
                        item["answer"] = item["options"][0]
                    if not item.get("timestamp") and index < len(concepts):
                        item["timestamp"] = round(float(concepts[index].get("timestamp", 0) or 0), 3)
                questions = parsed[:num_questions] or fallback_questions
                status = "gemini"
        except Exception as exc:
            print(f"Segment quiz generation Gemini pass failed: {exc}")

    return {
        "status": status,
        "questions": questions[:num_questions],
        "question_count": min(num_questions, len(questions)),
        "segment_length": len(transcript_text),
        "title_hint": title_hint,
    }

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Any

from .utils.transcript_store import get_chunks
from .utils.cache import get as cache_get, set as cache_set
from .session import get_session_history
from .rag import ask_question
from .models import SessionLocal, QuizQuestion, QuizResponse
from .utils.quiz_service import generate_or_get_quiz, get_next_question, submit_answer, get_performance
from .utils.education_ai import analyze_educational_content
from .v3_features.education_detector import detect_educational_sections, score_educational_relevance, identify_teaching_patterns, extract_implied_objectives, filter_non_educational_segments
from .v3_features.intelligent_timestamping import detect_concept_transitions, identify_teaching_moments, generate_smart_chapters, label_chapters_by_concept, create_checkpoint_markers
from .v3_features.concept_extractor import extract_concepts_hierarchical, detect_prerequisites, generate_concept_definitions, map_concept_relationships, assess_concept_difficulty, calculate_concept_importance
from .v3_features.summarizer_v2 import summarize_eli5, summarize_standard, summarize_expert, summarize_tldr, summarize_visual
from .v3_features.rag_v2 import generate_answer_with_reasoning, multi_hop_reasoning, cite_sources, maintain_conversation_context
from .v3_features.multi_pass_analyzer import run_all_passes
from .v3_features.objectives_extractor import build_objectives_profile
from .v3_features.notes_generator import build_study_notes


router = APIRouter(prefix="/v3", tags=["v3"])


class AnalyzeRequest(BaseModel):
    video_id: str
    transcript: str


class V3QuestionRequest(BaseModel):
    video_id: str
    question: str
    session_id: str | None = None


class PreferenceRequest(BaseModel):
    user_id: str
    learning_style: str | None = None
    difficulty_preference: str | None = None
    pace: str | None = None
    interests: list[str] | None = None
    background_knowledge: str | None = None


def _transcript_for_video(video_id: str) -> str:
    chunks = get_chunks(video_id)
    if not chunks:
        return ""
    return "\n".join(str(chunk.get("text", "")) for chunk in chunks)


def _chunks_for_video(video_id: str) -> list[dict[str, Any]]:
    return get_chunks(video_id) or []


def _profile_key(user_id: str) -> str:
    return f"v3:profile:{user_id}"


@router.post("/analyze/educational")
def analyze_educational(request: AnalyzeRequest):
    transcript = filter_non_educational_segments(request.transcript)
    cached = cache_get(f"v3:educational:{request.video_id}")
    if cached:
        import json
        return json.loads(cached)

    sections = detect_educational_sections(transcript)
    objectives = extract_implied_objectives(transcript)
    score = score_educational_relevance(transcript)
    teaching_mode = identify_teaching_patterns(transcript)
    payload = {
        "video_id": request.video_id,
        "educational_score": score,
        "teaching_mode": teaching_mode,
        "sections": sections,
        "learning_objectives": objectives,
        "status": "success",
    }
    import json
    cache_set(f"v3:educational:{request.video_id}", json.dumps(payload), ttl=3600)
    return payload


@router.post("/analyze/full")
def analyze_full(request: AnalyzeRequest):
    return {"video_id": request.video_id, "status": "success", **run_all_passes(filter_non_educational_segments(request.transcript))}


@router.get("/analyze/status/{video_id}")
def analyze_status(video_id: str, start: bool = False):
    """Return current educational analysis status for polling.

    When `start=true`, this endpoint also triggers analysis generation.
    """
    if start:
        analysis = analyze_educational_content(video_id)
    else:
        transcript = _transcript_for_video(video_id)
        if not transcript:
            return {"video_id": video_id, "status": "no_data"}
        analysis = analyze_educational_content(video_id)

    return {
        "video_id": video_id,
        "status": analysis.get("status", "success"),
        "educational_score": analysis.get("educational_score", 0),
        "chunk_count": analysis.get("chunk_count", 0),
        "transcript_length": analysis.get("transcript_length", 0),
    }


@router.get("/concepts/{video_id}")
def concepts(video_id: str):
    transcript = _transcript_for_video(video_id)
    concepts_tree = extract_concepts_hierarchical(transcript)
    flattened = []

    def _walk(nodes: list[dict[str, Any]], parent: str | None = None):
        for node in nodes:
            current = {k: v for k, v in node.items() if k != "children"}
            if parent:
                current["parent"] = parent
            flattened.append(current)
            children = node.get("children") or []
            if children:
                _walk(children, current.get("name"))

    _walk(concepts_tree)
    return {
        "video_id": video_id,
        "tree": concepts_tree,
        "concepts": flattened,
        "prerequisites": detect_prerequisites(concepts_tree),
        "definitions": generate_concept_definitions(transcript, [item.get("name", "") for item in flattened if item.get("name")]),
        "relationships": map_concept_relationships(concepts_tree),
    }


@router.get("/concepts/graph/{video_id}")
def concepts_graph(video_id: str):
    data = concepts(video_id)
    nodes = [{"id": item.get("name"), "label": item.get("name"), "difficulty": assess_concept_difficulty(item, _transcript_for_video(video_id)), "importance": calculate_concept_importance(item, 1)} for item in data["concepts"]]
    edges = [{"source": edge.get("source") or edge.get("concept"), "target": edge.get("target") or edge.get("prerequisite"), "type": edge.get("type", "prerequisite")} for edge in data["relationships"] + data["prerequisites"]]
    return {"video_id": video_id, "nodes": nodes, "edges": edges}


@router.get("/concepts/search")
def concepts_search(video_id: str, q: str):
    data = concepts(video_id)
    q_l = q.lower().strip()
    matches = [item for item in data["concepts"] if q_l in str(item.get("name", "")).lower() or q_l in str(item.get("definition", "")).lower()]
    return {"video_id": video_id, "query": q, "results": matches}


@router.get("/summaries/{video_id}")
def summaries(video_id: str, level: str = "standard"):
    transcript = _transcript_for_video(video_id)
    summary_map = {
        "eli5": summarize_eli5(transcript),
        "standard": summarize_standard(transcript),
        "expert": summarize_expert(transcript),
        "tldr": summarize_tldr(transcript),
        "visual": summarize_visual(transcript),
    }
    return {"video_id": video_id, "level": level, "summary": summary_map.get(level, summary_map["standard"]) }


@router.post("/qa/smart")
def qa_smart(request: V3QuestionRequest):
    transcript = _transcript_for_video(request.video_id)
    history = get_session_history(request.session_id) if request.session_id else []
    history = maintain_conversation_context(history)
    answer, timestamps = ask_question(request.video_id, request.question, history)
    reasoning = generate_answer_with_reasoning(request.question, transcript)
    cited = cite_sources(answer, transcript, timestamps)
    cited["reasoning"] = multi_hop_reasoning(request.question, transcript)
    cited["session_id"] = request.session_id
    cited["status"] = "success"
    return cited


@router.get("/objectives/{video_id}")
def objectives(video_id: str):
    transcript = _transcript_for_video(video_id)
    concepts = extract_concepts_hierarchical(transcript)
    profile = build_objectives_profile(transcript, concepts)
    return {
        "video_id": video_id,
        **profile,
        "concept_count": len(concepts),
    }


@router.get("/difficulty/{video_id}")
def difficulty(video_id: str):
    transcript = _transcript_for_video(video_id)
    score = score_educational_relevance(transcript)
    audience = "beginner" if score < 35 else "intermediate" if score < 70 else "advanced"
    return {
        "video_id": video_id,
        "vocabulary_score": min(100, len(set(transcript.lower().split()))),
        "math_score": 10 if any(token in transcript.lower() for token in ["equation", "formula", "derivative", "integral"]) else 0,
        "complexity_score": score,
        "overall_score": score,
        "target_audience": audience,
        "estimated_time_minutes": max(5, min(180, len(transcript.split()) // 2 or 5)),
    }


@router.get("/study-notes/{video_id}")
def study_notes(video_id: str):
    transcript = _transcript_for_video(video_id)
    concepts_tree = extract_concepts_hierarchical(transcript)
    objectives = build_objectives_profile(transcript, concepts_tree).get("objectives", [])
    notes = build_study_notes(transcript, concepts_tree, objectives)
    return {
        "video_id": video_id,
        "summary": notes["summary"],
        "outline": notes["outline"],
        "cornell": notes["cornell"],
        "glossary": notes["glossary"],
        "flashcards": notes["flashcards"],
        "summary_boxes": notes["key_points"],
        "key_terms": notes["key_terms"],
        "practice_problems": notes["practice_problems"],
        "visual_summaries": summarize_visual(transcript),
    }


@router.get("/analytics/{user_id}")
def analytics(user_id: str):
    db = SessionLocal()
    try:
        responses = db.query(QuizResponse).filter(QuizResponse.user_id == user_id).order_by(QuizResponse.answered_at.desc()).all()
        concepts_seen = len({response.question_id for response in responses})
        total = len(responses)
        correct = sum(1 for response in responses if response.is_correct)
        accuracy = round((correct / total) * 100, 1) if total else 0.0
        return {
            "user_id": user_id,
            "concept_mastery": min(100, accuracy + concepts_seen),
            "learning_velocity": round(concepts_seen / max(1, total), 2),
            "time_spent_minutes": total * 3,
            "weak_concepts": [],
            "progress_metrics": {"attempts": total, "correct": correct, "accuracy": accuracy},
        }
    finally:
        db.close()


@router.get("/analytics/dashboard")
def analytics_dashboard():
    db = SessionLocal()
    try:
        responses = db.query(QuizResponse).order_by(QuizResponse.answered_at.desc()).limit(50).all()
        questions = db.query(QuizQuestion).order_by(QuizQuestion.updated_at.desc()).limit(50).all()
        return {
            "status": "success",
            "recent_responses": len(responses),
            "recent_questions": len(questions),
            "summary": {"accuracy": get_performance(db).get("accuracy", 0.0), "active_questions": len(questions)},
        }
    finally:
        db.close()


@router.get("/learning-path/{user_id}")
def learning_path(user_id: str, goal: str | None = None):
    profile = cache_get(_profile_key(user_id))
    path = [goal or "core concepts", "practice quiz", "review weak concepts"]
    return {"user_id": user_id, "profile": profile, "path": path, "progress_percent": 0}


@router.get("/recommendations/{user_id}")
def recommendations(user_id: str):
    return {"user_id": user_id, "recommendations": ["Review quiz results", "Open a concept graph", "Try ELI5 summary"]}


@router.get("/compare/{concept}")
def compare(concept: str):
    return {"concept": concept, "similar_content": [], "teaching_styles": ["lecture", "demo"], "unique_insights": [f"Why {concept} matters"]}


@router.get("/review/next")
def review_next(user_id: str | None = None, video_id: str | None = None):
    db = SessionLocal()
    try:
        return get_next_question(db, video_id=video_id, user_id=user_id)
    finally:
        db.close()


@router.post("/profile/preferences")
def profile_preferences(request: PreferenceRequest):
    payload = request.model_dump()
    cache_set(_profile_key(request.user_id), __import__("json").dumps(payload), ttl=60 * 60 * 24 * 30)
    return {"status": "success", "preferences": payload}


@router.get("/profile/preferences")
def profile_preferences_get(user_id: str):
    value = cache_get(_profile_key(user_id))
    if not value:
        return {"status": "no_data", "preferences": {}}
    return {"status": "success", "preferences": __import__("json").loads(value)}

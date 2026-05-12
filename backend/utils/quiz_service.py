from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from ..models import QuizQuestion, QuizResponse
from .quiz_generator import generate_quiz


def _normalize_answer(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().lower()


def _parse_options(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except Exception:
        pass
    return []


def _to_question_payload(question: QuizQuestion) -> dict[str, Any]:
    return {
        "id": question.id,
        "video_id": question.video_id,
        "concept": question.concept,
        "type": question.question_type,
        "question": question.question_text,
        "options": _parse_options(question.options_json),
        "answer": question.correct_answer,
        "explanation": question.explanation,
        "timestamp": round(float(question.timestamp or 0), 3),
        "difficulty": question.difficulty,
        "attempts": question.attempts,
        "correct_attempts": question.correct_attempts,
        "next_review_at": question.next_review_at.isoformat() if question.next_review_at else None,
    }


def _ensure_questions_for_video(db: Session, video_id: str, user_id: str | None = None, session_id: str | None = None, num_questions: int = 5) -> list[QuizQuestion]:
    query = db.query(QuizQuestion).filter(QuizQuestion.video_id == video_id)
    if user_id is not None:
        query = query.filter(QuizQuestion.user_id == user_id)
    if session_id is not None:
        query = query.filter(QuizQuestion.session_id == session_id)

    existing = query.order_by(QuizQuestion.created_at.asc()).all()
    if existing:
        return existing

    generated = generate_quiz(video_id, num_questions=num_questions)
    question_items = generated.get("questions", []) if isinstance(generated, dict) else []

    created_questions: list[QuizQuestion] = []
    for item in question_items:
        if not isinstance(item, dict) or not item.get("question"):
            continue
        question = QuizQuestion(
            id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            video_id=video_id,
            concept=str(item.get("concept", "")).strip() or None,
            question_type=str(item.get("type", "mcq")).strip() or "mcq",
            question_text=str(item.get("question", "")).strip(),
            correct_answer=str(item.get("answer", "")).strip(),
            options_json=json.dumps(item.get("options", []), ensure_ascii=False),
            explanation=str(item.get("explanation", "")).strip() or None,
            timestamp=float(item.get("timestamp", 0) or 0),
            difficulty=str(generated.get("teaching_mode", "medium")) if isinstance(generated, dict) else "medium",
            next_review_at=datetime.utcnow(),
        )
        db.add(question)
        created_questions.append(question)

    db.commit()
    for question in created_questions:
        db.refresh(question)
    return created_questions


def generate_or_get_quiz(db: Session, video_id: str, num_questions: int = 5, user_id: str | None = None, session_id: str | None = None) -> dict[str, Any]:
    questions = _ensure_questions_for_video(db, video_id, user_id=user_id, session_id=session_id, num_questions=num_questions)
    return {
        "video_id": video_id,
        "status": "success" if questions else "no_data",
        "question_count": len(questions),
        "questions": [_to_question_payload(question) for question in questions[:num_questions]],
    }


def get_next_question(db: Session, video_id: str | None = None, user_id: str | None = None, session_id: str | None = None) -> dict[str, Any]:
    query = db.query(QuizQuestion)
    if video_id:
        query = query.filter(QuizQuestion.video_id == video_id)
    if user_id is not None:
        query = query.filter(QuizQuestion.user_id == user_id)
    if session_id is not None:
        query = query.filter(QuizQuestion.session_id == session_id)

    question = query.order_by(QuizQuestion.next_review_at.asc(), QuizQuestion.created_at.asc()).first()
    if not question and video_id:
        generated = _ensure_questions_for_video(db, video_id, user_id=user_id, session_id=session_id)
        question = generated[0] if generated else None

    if not question:
        return {"status": "no_data", "message": "No quiz questions available yet."}

    return {"status": "success", "question": _to_question_payload(question)}


def submit_answer(db: Session, question_id: str, answer: str, user_id: str | None = None, session_id: str | None = None) -> dict[str, Any]:
    question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not question:
        return {"status": "not_found", "message": "Question not found."}

    normalized_user_answer = _normalize_answer(answer)
    normalized_correct_answer = _normalize_answer(question.correct_answer)
    is_correct = normalized_user_answer == normalized_correct_answer

    question.attempts = int(question.attempts or 0) + 1
    if is_correct:
        question.correct_attempts = int(question.correct_attempts or 0) + 1

    quality = 5 if is_correct else 2
    ease_factor = float(question.ease_factor or 2.5)
    ease_factor = max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    interval_days = int(question.interval_days or 0)
    if interval_days <= 0:
        interval_days = 1 if is_correct else 0
    else:
        interval_days = int(round(interval_days * (ease_factor if is_correct else 1.0)))
        interval_days = max(1 if is_correct else 0, interval_days)

    question.ease_factor = ease_factor
    question.interval_days = interval_days
    question.last_review_at = datetime.utcnow()
    question.next_review_at = datetime.utcnow() + timedelta(days=interval_days or 1)

    score = 100 if is_correct else 35
    feedback = question.explanation or "Review the underlying concept and try again."

    response = QuizResponse(
        id=str(uuid.uuid4()),
        question_id=question.id,
        user_id=user_id,
        session_id=session_id,
        video_id=question.video_id,
        answer=str(answer),
        is_correct=is_correct,
        score=score,
        feedback=feedback,
    )

    db.add(response)
    db.add(question)
    db.commit()

    return {
        "status": "success",
        "question_id": question.id,
        "is_correct": is_correct,
        "score": score,
        "correct_answer": question.correct_answer,
        "explanation": question.explanation,
        "next_review_at": question.next_review_at.isoformat() if question.next_review_at else None,
        "attempts": question.attempts,
        "correct_attempts": question.correct_attempts,
    }


def get_performance(db: Session, video_id: str | None = None, user_id: str | None = None, session_id: str | None = None) -> dict[str, Any]:
    query = db.query(QuizResponse)
    if video_id:
        query = query.filter(QuizResponse.video_id == video_id)
    if user_id is not None:
        query = query.filter(QuizResponse.user_id == user_id)
    if session_id is not None:
        query = query.filter(QuizResponse.session_id == session_id)

    responses = query.order_by(QuizResponse.answered_at.desc()).all()
    total = len(responses)
    correct = sum(1 for response in responses if response.is_correct)
    average_score = round(sum(int(response.score or 0) for response in responses) / total, 1) if total else 0.0
    accuracy = round((correct / total) * 100, 1) if total else 0.0

    next_review = None
    question_query = db.query(QuizQuestion)
    if video_id:
        question_query = question_query.filter(QuizQuestion.video_id == video_id)
    if user_id is not None:
        question_query = question_query.filter(QuizQuestion.user_id == user_id)
    if session_id is not None:
        question_query = question_query.filter(QuizQuestion.session_id == session_id)
    next_question = question_query.order_by(QuizQuestion.next_review_at.asc()).first()
    if next_question and next_question.next_review_at:
        next_review = next_question.next_review_at.isoformat()

    return {
        "status": "success",
        "video_id": video_id,
        "attempts": total,
        "correct": correct,
        "accuracy": accuracy,
        "average_score": average_score,
        "next_review_at": next_review,
        "recent_responses": [
            {
                "question_id": response.question_id,
                "is_correct": response.is_correct,
                "score": response.score,
                "answered_at": response.answered_at.isoformat() if response.answered_at else None,
            }
            for response in responses[:10]
        ],
    }
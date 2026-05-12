from __future__ import annotations

from threading import Lock
import re
import time

sessions = {}
qa_cache = {}
_lock = Lock()
_qa_cache_ttl_seconds = 60 * 30
_qa_cache_max_items = 200


def _normalize_question(question: str) -> str:
    return " ".join(re.findall(r"\w+", str(question or "").lower()))


def _cache_key(session_id: str | None, video_id: str | None, question: str) -> tuple[str, str, str]:
    return (str(session_id or ""), str(video_id or ""), _normalize_question(question))


def _purge_cache() -> None:
    now = time.time()
    expired = [key for key, value in qa_cache.items() if now - value.get("created_at", now) > _qa_cache_ttl_seconds]
    for key in expired:
        qa_cache.pop(key, None)
    if len(qa_cache) > _qa_cache_max_items:
        overflow = len(qa_cache) - _qa_cache_max_items
        for key, _value in sorted(qa_cache.items(), key=lambda item: item[1].get("created_at", 0))[:overflow]:
            qa_cache.pop(key, None)


def get_session_history(session_id):
    with _lock:
        return list(sessions.get(session_id, []))


def add_to_session(session_id, question, answer):
    if not session_id:
        return
    with _lock:
        sessions.setdefault(session_id, []).append({"question": question, "answer": answer})


def get_cached_answer(session_id: str | None, video_id: str | None, question: str):
    key = _cache_key(session_id, video_id, question)
    with _lock:
        _purge_cache()
        cached = qa_cache.get(key)
        if not cached:
            return None
        return {
            "answer": cached.get("answer", ""),
            "timestamps": list(cached.get("timestamps", [])),
            "session_id": cached.get("session_id") or session_id,
        }


def cache_answer(session_id: str | None, video_id: str | None, question: str, answer, timestamps=None):
    key = _cache_key(session_id, video_id, question)
    payload = {
        "answer": answer,
        "timestamps": list(timestamps or []),
        "session_id": session_id,
        "created_at": time.time(),
    }
    with _lock:
        _purge_cache()
        qa_cache[key] = payload
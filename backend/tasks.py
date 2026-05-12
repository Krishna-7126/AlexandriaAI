"""Background task entrypoints for RQ workers.

These functions are importable by RQ and used to perform long-running
LLM-backed analysis in the background, storing results in Redis for fast
retrieval by the frontend.
"""
from __future__ import annotations

from .v3_features import analysis_runner
from .utils import queue


def run_educational_analysis(video_id: str, transcript: str) -> dict:
    """Run the LLM-backed analysis and cache the result."""
    try:
        result = analysis_runner.analyze_transcript_with_llm(transcript)
        payload = {
            "video_id": video_id,
            "status": "gemini",
            **result,
        }
        # Store cached payload under v3 key
        queue.cache_set(f"v3:educational:{video_id}", payload, ttl=60 * 60 * 24)
        return payload
    except Exception as exc:
        # Do not propagate errors to the worker; return fallback
        return {"video_id": video_id, "status": "failed", "error": str(exc)}

"""LLM-backed analysis runner for v3 features.

Attempts to use the project's LLM client (`backend.utils.gemini_client`) when available
and falls back to lightweight local stubs otherwise.
"""
from typing import Dict, Any
from ..utils.gemini_client import gemini_available, generate_text
from .education_detector import detect_educational_sections, extract_implied_objectives
from .concept_extractor import extract_concepts_hierarchical


def analyze_transcript_with_llm(transcript: str) -> Dict[str, Any]:
    if not transcript:
        return {"sections": [], "learning_objectives": [], "concepts": []}

    if gemini_available():
        prompt = (
            "You are an assistant that extracts structured educational analysis from a transcript. "
            "Return JSON with keys: sections (list of {start,end,label,confidence}), "
            "learning_objectives (list of short statements), concepts (list of {name,definition}).\n\n"
            f"Transcript:\n{transcript[:4000]}\n\nJSON:\n"
        )
        try:
            text = generate_text(prompt, temperature=0.0, max_output_tokens=800)
            if text:
                import json

                # Try to parse trailing JSON in the response
                start = text.find('{')
                if start >= 0:
                    json_text = text[start:]
                else:
                    json_text = text
                parsed = json.loads(json_text)
                return parsed
        except Exception:
            pass

    # Fallback: use the local stubs for a basic analysis
    sections = detect_educational_sections(transcript)
    objectives = extract_implied_objectives(transcript)
    concepts = extract_concepts_hierarchical(transcript)
    return {"sections": sections, "learning_objectives": objectives, "concepts": concepts}

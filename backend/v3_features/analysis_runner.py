"""LLM-backed analysis runner for v3 features.

Attempts to use the project's LLM client (`backend.utils.gemini_client`) when available
and falls back to lightweight local stubs otherwise.
"""
from typing import Dict, Any
from ..utils.gemini_client import gemini_available, generate_text
from .education_detector import detect_educational_sections, extract_implied_objectives
from .concept_extractor import extract_concepts_hierarchical
import re
import json
import time


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
            # Try up to 2 retries to coax strictly JSON output
            attempts = 0
            raw = None
            while attempts < 3:
                raw = generate_text(prompt, temperature=0.0, max_output_tokens=800, model_name=None)
                if not raw:
                    attempts += 1
                    time.sleep(0.3)
                    continue

                # Strategy 1: look for JSON between ```json``` fences
                m = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", raw, re.IGNORECASE)
                if m:
                    candidate = m.group(1)
                else:
                    # Strategy 2: look for first balanced JSON object starting at first '{'
                    start = raw.find('{')
                    candidate = None
                    if start >= 0:
                        # attempt to extract a balanced JSON object
                        depth = 0
                        end_idx = None
                        for i in range(start, len(raw)):
                            if raw[i] == '{':
                                depth += 1
                            elif raw[i] == '}':
                                depth -= 1
                                if depth == 0:
                                    end_idx = i + 1
                                    break
                        if end_idx:
                            candidate = raw[start:end_idx]

                # Strategy 3: if labeled JSON after 'JSON:' take trailing text
                if not candidate:
                    label_idx = raw.lower().rfind('json:')
                    if label_idx >= 0:
                        candidate = raw[label_idx + 5 :].strip()

                if not candidate:
                    # as last resort, use entire text
                    candidate = raw

                try:
                    parsed = json.loads(candidate)
                    return parsed
                except Exception:
                    # refine prompt to ask for only JSON and retry
                    prompt = (
                        "You must return ONLY valid JSON with the schema: {sections, learning_objectives, concepts}. "
                        "Do not add any commentary. Respond with a single JSON object.\n\n"
                        f"Transcript:\n{transcript[:4000]}\n\nJSON:\n"
                    )
                    attempts += 1
                    time.sleep(0.5)
                    continue
        except Exception:
            pass

    # Fallback: use the local stubs for a basic analysis
    sections = detect_educational_sections(transcript)
    objectives = extract_implied_objectives(transcript)
    concepts = extract_concepts_hierarchical(transcript)
    return {"sections": sections, "learning_objectives": objectives, "concepts": concepts}

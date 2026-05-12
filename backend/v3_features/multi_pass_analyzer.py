"""Orchestrator for multi-pass LLM analysis (v3 stub).

This is a simple orchestrator that calls the other v3 stubs in sequence.
"""
from typing import Dict, Any
from .education_detector import detect_educational_sections, extract_implied_objectives
from .concept_extractor import extract_concepts_hierarchical


def run_all_passes(transcript: str) -> Dict[str, Any]:
    sections = detect_educational_sections(transcript)
    objectives = extract_implied_objectives(transcript)
    concepts = extract_concepts_hierarchical(transcript)
    return {
        "sections": sections,
        "learning_objectives": objectives,
        "concepts": concepts,
    }

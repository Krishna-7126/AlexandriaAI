"""Concept extraction helpers (v3 stub).

Produce hierarchical concepts and simple definitions.
"""
from typing import List, Dict, Any
import re


def extract_concepts_hierarchical(transcript: str) -> List[Dict[str, Any]]:
    """Return a shallow hierarchy of concepts."""
    if not transcript:
        return []
    words = [word.strip(".,:;!?()[]{}").lower() for word in transcript.split()]
    common = []
    for word in words:
        if len(word) < 5:
            continue
        if word not in common and word not in {"therefore", "because", "example", "concept", "learning", "teaching"}:
            common.append(word)
        if len(common) >= 5:
            break
    if not common:
        common = ["main idea", "supporting detail"]
    return [
        {
            "name": common[0].title(),
            "definition": f"A core topic related to {common[0]}",
            "difficulty": "medium",
            "importance": 0.8,
            "children": [
                {"name": concept.title(), "definition": f"A subtopic about {concept}", "difficulty": "easy", "importance": 0.5}
                for concept in common[1:]
            ],
        }
    ]


def detect_prerequisites(concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return simple prerequisite mappings."""
    prerequisites = []
    names = [str(concept.get("name", "")).strip() for concept in concepts if concept.get("name")]
    for index in range(1, len(names)):
        prerequisites.append({"concept": names[index], "prerequisite": names[index - 1]})
    return prerequisites


def generate_concept_definitions(transcript: str, concepts: List[str]) -> Dict[str, str]:
    sentences = re.split(r"[\.\n]", transcript or "")
    definitions = {}
    for concept in concepts:
        concept_l = concept.lower()
        matched = next((sentence.strip() for sentence in sentences if concept_l in sentence.lower()), None)
        definitions[concept] = matched[:160] if matched else f"Definition for {concept}"
    return definitions


def map_concept_relationships(concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    relationships = []
    for index in range(1, len(concepts)):
        relationships.append({"source": concepts[index - 1].get("name"), "target": concepts[index].get("name"), "type": "related_to"})
    return relationships


def assess_concept_difficulty(concept: Dict[str, Any], content: str) -> str:
    text = (concept.get("name", "") + " " + content).lower()
    if any(token in text for token in ["advanced", "complex", "algorithm", "derivative", "proof"]):
        return "hard"
    if any(token in text for token in ["basic", "intro", "simple", "overview"]):
        return "easy"
    return "medium"


def calculate_concept_importance(concept: Dict[str, Any], occurrences: int) -> float:
    base = 0.4 + min(0.5, occurrences / 10.0)
    if concept.get("children"):
        base += 0.1
    return round(min(1.0, base), 2)

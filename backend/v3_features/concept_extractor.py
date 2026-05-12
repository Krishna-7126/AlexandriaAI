"""Concept extraction helpers for v3 educational analysis.

These helpers stay lightweight and deterministic so they can run without an
LLM call when the transcript is short, noisy, or the model is unavailable.
"""
from typing import List, Dict, Any
import re
from collections import Counter


_STOPWORDS = {
    "about",
    "after",
    "again",
    "also",
    "because",
    "before",
    "being",
    "between",
    "could",
    "example",
    "first",
    "from",
    "have",
    "here",
    "into",
    "learning",
    "maybe",
    "more",
    "other",
    "should",
    "since",
    "teach",
    "teaching",
    "that",
    "there",
    "these",
    "they",
    "this",
    "those",
    "understanding",
    "using",
    "want",
    "when",
    "where",
    "with",
}


def _tokenize(text: str) -> list[str]:
    tokens = []
    for raw_word in re.findall(r"[A-Za-z][A-Za-z0-9_'-]*", text or ""):
        word = raw_word.strip("-_'\"").lower()
        if len(word) < 4 or word in _STOPWORDS:
            continue
        tokens.append(word[:-1] if word.endswith("s") and len(word) > 5 else word)
    return tokens


def _sentence_candidates(transcript: str) -> list[str]:
    sentences = []
    for sentence in re.split(r"(?<=[.?!])\s+|\n+", transcript or ""):
        sentence = sentence.strip()
        if sentence:
            sentences.append(sentence)
    return sentences


def extract_concepts_hierarchical(transcript: str) -> List[Dict[str, Any]]:
    """Return a shallow hierarchy of concepts."""
    if not transcript:
        return []
    tokens = _tokenize(transcript)
    if not tokens:
        tokens = ["main idea", "supporting detail"]

    frequency = Counter(tokens)
    ordered: list[str] = []
    for token, _count in frequency.most_common():
        if token not in ordered:
            ordered.append(token)
        if len(ordered) >= 5:
            break

    if not ordered:
        ordered = ["main idea", "supporting detail"]

    core = ordered[0]
    core_sentence = next((sentence.strip() for sentence in _sentence_candidates(transcript) if core in sentence.lower()), None)
    definition = core_sentence[:180] if core_sentence else f"A core topic related to {core}"
    return [
        {
            "name": core.replace("_", " ").title(),
            "definition": definition,
            "difficulty": "medium" if len(tokens) > 12 else "easy",
            "importance": 0.85,
            "children": [
                {
                    "name": concept.replace("_", " ").title(),
                    "definition": f"A subtopic about {concept}",
                    "difficulty": "easy" if frequency[concept] < 3 else "medium",
                    "importance": 0.5 if frequency[concept] < 3 else 0.7,
                }
                for concept in ordered[1:]
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
    sentences = _sentence_candidates(transcript)
    definitions = {}
    for concept in concepts:
        concept_l = concept.lower()
        matched = next((sentence for sentence in sentences if concept_l in sentence.lower()), None)
        definitions[concept] = matched[:160] if matched else f"Definition for {concept}"
    return definitions


def map_concept_relationships(concepts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    relationships = []
    for index in range(1, len(concepts)):
        relationships.append({"source": concepts[index - 1].get("name"), "target": concepts[index].get("name"), "type": "related_to"})
    for concept in concepts:
        for child in concept.get("children") or []:
            relationships.append({"source": concept.get("name"), "target": child.get("name"), "type": "contains"})
    return relationships


def assess_concept_difficulty(concept: Dict[str, Any], content: str) -> str:
    text = (concept.get("name", "") + " " + concept.get("definition", "") + " " + content).lower()
    if any(token in text for token in ["advanced", "complex", "algorithm", "derivative", "proof", "matrix", "optimization"]):
        return "hard"
    if any(token in text for token in ["basic", "intro", "simple", "overview", "beginner"]):
        return "easy"
    return "medium" if len(_tokenize(text)) > 14 else "easy"


def calculate_concept_importance(concept: Dict[str, Any], occurrences: int) -> float:
    base = 0.4 + min(0.5, occurrences / 10.0)
    if concept.get("children"):
        base += 0.1
    if len(str(concept.get("definition", "")).split()) > 18:
        base += 0.05
    return round(min(1.0, base), 2)

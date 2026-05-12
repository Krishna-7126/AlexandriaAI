import pytest

from backend.v3_features import education_detector, concept_extractor, intelligent_timestamping, analysis_runner


def test_education_detector_basic():
    text = "This lecture explains the basics of X and how to use it."
    sections = education_detector.detect_educational_sections(text)
    assert isinstance(sections, list)
    assert len(sections) >= 1


def test_concept_extractor_basic():
    text = "A discussion about main concept and subtleties"
    concepts = concept_extractor.extract_concepts_hierarchical(text)
    assert isinstance(concepts, list)


def test_timestamping_stub():
    chunks = [{"start": 0, "text": "intro"}, {"start": 30, "text": "topic"}]
    ts = intelligent_timestamping.detect_concept_transitions(chunks)
    assert isinstance(ts, list)


def test_analysis_runner_fallback():
    text = "Explain the concept of testing in 2 lines."
    result = analysis_runner.analyze_transcript_with_llm(text)
    assert "sections" in result and "learning_objectives" in result and "concepts" in result

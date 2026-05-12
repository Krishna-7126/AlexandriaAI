from fastapi.testclient import TestClient

from backend.main import app
from backend.utils.transcript_store import store_chunks


client = TestClient(app)


def setup_module(module):
    store_chunks("v3-test-video", [
        {"start": 0, "end": 10, "text": "This lesson explains the concept of testing with examples."},
        {"start": 10, "end": 20, "text": "We demonstrate how to write a quiz and review learning objectives."},
    ])


def test_v3_analyze_educational():
    response = client.post("/v3/analyze/educational", json={"video_id": "v3-test-video", "transcript": "This lesson explains the concept of testing with examples."})
    assert response.status_code == 200
    body = response.json()
    assert body["video_id"] == "v3-test-video"
    assert "educational_score" in body
    assert "sections" in body


def test_v3_concepts_and_summary_endpoints():
    concepts = client.get("/v3/concepts/v3-test-video")
    assert concepts.status_code == 200
    assert "tree" in concepts.json()

    summary = client.get("/v3/summaries/v3-test-video", params={"level": "tldr"})
    assert summary.status_code == 200
    assert summary.json()["summary"]


def test_v3_objectives_endpoint():
    response = client.get("/v3/objectives/v3-test-video")
    assert response.status_code == 200
    body = response.json()
    assert body["video_id"] == "v3-test-video"
    assert body["objectives"]
    assert body["checklist"]
    assert len(body["objectives"]) == len(body["blooms"]) == len(body["coverage"])


def test_v3_study_notes_endpoint():
    response = client.get("/v3/study-notes/v3-test-video")
    assert response.status_code == 200
    body = response.json()
    assert body["video_id"] == "v3-test-video"
    assert body["summary"]
    assert body["outline"]
    assert body["glossary"]
    assert body["flashcards"]


def test_v3_profile_preferences_roundtrip():
    post = client.post("/v3/profile/preferences", json={"user_id": "u1", "learning_style": "visual", "difficulty_preference": "beginner", "pace": "normal", "interests": ["testing"], "background_knowledge": "basic"})
    assert post.status_code == 200

    get = client.get("/v3/profile/preferences", params={"user_id": "u1"})
    assert get.status_code == 200
    assert get.json()["preferences"]["learning_style"] == "visual"

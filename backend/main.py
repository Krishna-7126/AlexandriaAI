from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid
from .ingest import ingest_video
from .rag import ask_question
from .summarizer import get_summary
from .session import get_session_history, add_to_session

app = FastAPI()

class IngestRequest(BaseModel):
    video_url: str

class AskRequest(BaseModel):
    video_id: str
    question: str
    session_id: str = None

@app.get("/ping")
def ping():
    return {"message": "working"}

@app.post("/ingest")
def ingest(request: IngestRequest):
    try:
        video_id = str(uuid.uuid4())
        ingest_video(request.video_url, video_id)
        return {"video_id": video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
def ask(request: AskRequest):
    try:
        history = get_session_history(request.session_id) if request.session_id else []
        answer, timestamps = ask_question(request.video_id, request.question, history)
        if request.session_id:
            add_to_session(request.session_id, request.question, answer)
        return {"answer": answer, "timestamps": timestamps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary/{video_id}")
def summary(video_id: str):
    try:
        summary_text = get_summary(video_id)
        return {"summary": summary_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/timestamps/{video_id}")
def timestamps(video_id: str):
    try:
        import chromadb
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_collection(name="transcripts")
        results = collection.get(where={"video_id": video_id})
        if not results['ids']:
            raise Exception("No timestamps found")
        ts = [
            {"time": int(metadata.get('start_time', 0)), "label": f"Chunk {i + 1}"}
            for i, metadata in enumerate(results['metadatas'])
        ]
        return ts
    except Exception as e:
        print(f"Timestamps failed: {e}")
        return [{"time": 0, "label": "Start"}]

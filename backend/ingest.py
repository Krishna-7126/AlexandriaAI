import yt_dlp
import whisper
from sentence_transformers import SentenceTransformer
import chromadb
import os
from .utils.chunker import chunk_transcript
from .utils.transcript_loader import load_transcript

def ingest_video(video_url, video_id):
    try:
        # Download audio if YouTube
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': f'./temp/{video_id}.%(ext)s',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }
            os.makedirs('./temp', exist_ok=True)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
            audio_path = f'./temp/{video_id}.mp3'
        else:
            audio_path = video_url  # assume local file

        # Transcribe with Whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        transcript = result["text"]
        segments = result["segments"]
    except Exception as e:
        print(f"Whisper failed: {e}, using fallback transcript")
        transcript = load_transcript()
        segments = [{"text": transcript, "start": 0, "end": len(transcript.split()) * 0.5}]  # dummy

    # Chunk
    chunks = chunk_transcript(transcript, segments)

    # Embed
    try:
        model_emb = SentenceTransformer('all-MiniLM-L6-v2')
        embeddings = model_emb.encode([c['text'] for c in chunks])
    except Exception as e:
        print(f"Embeddings failed: {e}, using keyword fallback")
        embeddings = None  # will handle in rag

    # Store in ChromaDB
    try:
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_or_create_collection(name="transcripts")
        for i, chunk in enumerate(chunks):
            metadata = {
                "text": chunk['text'],
                "start_time": chunk['start'],
                "end_time": chunk['end'],
                "video_id": video_id
            }
            if embeddings is not None:
                collection.add(
                    ids=[f"{video_id}_{i}"],
                    embeddings=[embeddings[i]],
                    metadatas=[metadata]
                )
            else:
                collection.add(
                    ids=[f"{video_id}_{i}"],
                    metadatas=[metadata]
                )
    except Exception as e:
        print(f"ChromaDB failed: {e}, storing in memory")
        # Fallback: store in global list
        global fallback_store
        if 'fallback_store' not in globals():
            fallback_store = []
        for chunk in chunks:
            fallback_store.append(chunk)
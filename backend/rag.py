import chromadb
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .utils.similarity import keyword_similarity

def ask_question(video_id, question, history=[]):
    try:
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_collection(name="transcripts")
        results = collection.get(where={"video_id": video_id})
        if not results['ids']:
            raise Exception("No data found")
        texts = results['metadatas']
        embeddings = results.get('embeddings')
    except Exception as e:
        print(f"ChromaDB failed: {e}, using fallback")
        global fallback_store
        if 'fallback_store' not in globals():
            fallback_store = []
        texts = [c for c in fallback_store if c['video_id'] == video_id]
        embeddings = None

    if not texts:
        return (
            "I could not find transcript data for that video yet. Please ingest a video first.",
            [0, 0],
        )

    best_idx = 0
    if embeddings:
        try:
            model_emb = SentenceTransformer('all-MiniLM-L6-v2')
            q_emb = model_emb.encode([question])[0]
            similarities = cosine_similarity([q_emb], embeddings)[0]
            best_idx = int(np.argmax(similarities))
        except Exception as e:
            print(f"Embedding QA failed: {e}, falling back to text matching")
            embeddings = None

    if embeddings is None:
        try:
            model_emb = SentenceTransformer('all-MiniLM-L6-v2')
            text_embs = model_emb.encode([t['text'] for t in texts])
            q_emb = model_emb.encode([question])[0]
            similarities = cosine_similarity([q_emb], text_embs)[0]
            best_idx = int(np.argmax(similarities))
        except Exception as e:
            print(f"Text embedding failed: {e}, using keyword matching")
            similarities = [keyword_similarity(question, t['text']) for t in texts]
            best_idx = int(np.argmax(similarities))

    best_chunk = texts[best_idx]
    answer = best_chunk.get('text', '').strip() or "I found transcript content, but the text is empty."
    timestamps = [best_chunk.get('start_time', 0), best_chunk.get('end_time', 0)]
    return answer, timestamps

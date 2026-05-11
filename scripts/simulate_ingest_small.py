import os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from backend.ingest import ingest_transcript

# Small transcript with artificially millisecond segments to simulate AssemblyAI word timings
transcript = "Hello world. This is a short test transcript to validate chunking." * 5
segments = []
words = transcript.split()
# Create per-word segments with ms timestamps (start in ms)
for i, w in enumerate(words):
    start_ms = i * 250  # 0.25s per word but in ms (250)
    end_ms = start_ms + 200
    segments.append({"text": w, "start": start_ms, "end": end_ms})

payload = ingest_transcript(transcript, "sim_test", segments, source="sim", method="assemblyai_sim")
print(payload)
from backend.utils.transcript_store import get_chunks
chunks = get_chunks("sim_test")
print('stored chunks count:', len(chunks))
for c in chunks[:3]:
    print(c)

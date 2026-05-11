import os
import sys
# Ensure repo root is on PYTHONPATH so `backend` package imports work when running script directly
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.utils.transcript_store import clear_chunks, store_chunks, get_chunks
from backend.main import timestamps

VIDEO_ID = "test_video_timestamps"

# Clear any existing data
clear_chunks(VIDEO_ID)

# Store a chunk with millisecond timestamps to ensure normalization happens
chunk = {
    "text": "This is a test chunk",
    "start_time": 12345,  # milliseconds
    "end_time": 12445,
    "video_id": VIDEO_ID,
    "source": "unit_test",
    "method": "test",
}
store_chunks(VIDEO_ID, [chunk])

resp = timestamps(VIDEO_ID)
print(resp)

assert resp.get("status") == "success", "Timestamps endpoint did not return success"
assert resp.get("count", 0) == 1, "Expected one timestamp"
first = resp["timestamps"][0]
expected = round(12345 / 1000.0, 3)
assert abs(first["time"] - expected) < 1e-6, f"Expected time {expected}, got {first['time']}"
print("Timestamp unit test passed")

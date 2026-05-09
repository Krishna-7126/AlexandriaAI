# AI-Powered Learning Companion (Backend Only)

## How to run

1. Install dependencies:
   ```powershell
   cd z:\AI-Learning-Companion\backend
   python -m pip install -r requirements.txt
   ```

2. Run the server from the repository root:
   ```powershell
   cd z:\AI-Learning-Companion
   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. Open the API docs:
   ```text
   http://localhost:8000/docs
   ```

## API endpoints

- `GET /ping` — health check
- `POST /ingest` — ingest a video URL or local path
- `POST /ask` — ask a question against a video
- `GET /summary/{video_id}` — get a summary
- `GET /timestamps/{video_id}` — get chunk timestamps

## Local secret handling

- Copy `backend/.env.example` to `backend/.env`
- Do not commit `.env`
- Keep secret API keys out of GitHub

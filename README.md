# AI Learning Companion for YouTube Lectures

AI Learning Companion is a hackathon MVP that helps students learn from YouTube lectures. A user loads a YouTube video, the backend extracts captions when available, processes the transcript into searchable chunks, and answers questions using simple keyword matching.

The goal is to keep the system free, fast, and easy to demo.

## Problem Statement

Students often watch long lecture videos and need quick help finding the most relevant explanation, reviewing key points, or asking questions about the content. Manually scrubbing through a video is slow, and full AI/RAG systems can be too expensive or complex for a hackathon MVP.

This project solves that by using YouTube captions and lightweight transcript search to provide quick Q&A and summaries without paid APIs.

## Solution Overview

The app works in three simple parts:

1. The user enters a YouTube lecture URL.
2. The backend fetches the transcript from YouTube captions. If captions are unavailable, the user can paste a manual transcript.
3. The backend cleans and chunks the transcript, then uses keyword matching to answer questions and generate a short summary.

This is not a full LLM-based system yet. It is intentionally simple so it can run for free and be extended later.

## Features

### AI Q&A

Users can ask questions about the loaded lecture. The backend extracts important words from the question, compares them against transcript chunks, and returns the most relevant chunk as the answer.

### Transcript Extraction

The backend supports:

- YouTube captions through the `youtube-transcript` package
- Auto-generated captions when YouTube exposes them through the same caption source
- Manual transcript input when no captions are available

### Summary Generation

The summary endpoint returns a short overview from the most useful early transcript chunks. This keeps the MVP free and fast while still giving judges and users a useful lecture preview.

## Tech Stack

### Frontend

- React
- Fetch API or Axios for backend requests
- Simple UI with:
  - YouTube URL input
  - Manual transcript textarea fallback
  - Ask-question box
  - Answer display
  - Summary display

### Backend

- Node.js
- Express.js
- `youtube-transcript` for caption fetching
- In-memory transcript storage for the MVP

### AI Logic

- Keyword extraction
- Stop-word filtering
- Transcript chunk scoring
- Best-match answer selection

No paid AI APIs are required.

## How It Works

1. User enters a YouTube URL in the frontend.
2. Frontend sends the URL to `POST /load-video`.
3. Backend tries to fetch captions using `youtube-transcript`.
4. If captions are found, the backend cleans the transcript.
5. If captions are not found, the backend returns an error asking for a manual transcript.
6. User can paste a transcript and call `POST /load-video` again with `manualTranscript`.
7. Backend splits the transcript into small chunks.
8. User asks a question through `POST /ask`.
9. Backend scores transcript chunks against the question keywords.
10. Backend returns the most relevant chunk as the answer.
11. User can call `GET /summary` to get a short lecture summary.

## Folder Structure

```text
AI-Learning-Companion/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── routes/
│   │   └── apiRoutes.js
│   ├── services/
│   │   ├── transcriptService.js
│   │   └── qaService.js
│   ├── utils/
│   ├── data/
│   └── legacy Python files
├── frontend/
│   └── React app files
├── README.md
├── TESTING_GUIDE.md
└── FRONTEND_INTEGRATION.md
```

### Backend Files

- `backend/server.js`: Starts the Express server and registers routes.
- `backend/routes/apiRoutes.js`: Defines `/load-video`, `/ask`, and `/summary`.
- `backend/services/transcriptService.js`: Fetches, cleans, and chunks transcripts.
- `backend/services/qaService.js`: Handles keyword matching, answering, and summary generation.
- `backend/package.json`: Node dependencies and start scripts.

### Frontend Files

The frontend can be built as a standard React app in a `frontend/` folder. It should call the backend endpoints and display loading states, errors, answers, and summaries.

## Setup Instructions

### Prerequisites

- Node.js 18 or newer
- npm
- A browser
- Optional: Python, only if you want to inspect or reuse the older Python backend files

## Run the Backend

From the project root:

```powershell
cd backend
npm install
npm start
```

The backend will run on:

```text
http://localhost:3000
```

For development with auto-restart:

```powershell
npm run dev
```

## Run the Frontend

If the React frontend has not been created yet, create it from the project root:

```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

The Vite frontend usually runs on:

```text
http://localhost:5173
```

In the React app, call the backend at:

```text
http://localhost:3000
```

Example frontend request:

```js
const response = await fetch("http://localhost:3000/load-video", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ youtubeUrl }),
});
```

If CORS is needed during frontend integration, add the `cors` package to the backend and enable it in `server.js`.

## API Endpoints

### `GET /`

Health and service overview.

Response:

```json
{
  "service": "AI Learning Companion",
  "status": "ok",
  "endpoints": ["POST /load-video", "POST /ask", "GET /summary"]
}
```

### `POST /load-video`

Loads a YouTube video transcript or manual transcript.

Request with YouTube URL:

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Request with manual transcript:

```json
{
  "manualTranscript": "Paste lecture transcript text here..."
}
```

Success response:

```json
{
  "status": "loaded",
  "source": "youtube-captions",
  "chunks": 12
}
```

No captions response:

```json
{
  "error": "No captions found. Please send manualTranscript in /load-video."
}
```

### `POST /ask`

Answers a question using the currently loaded transcript.

Request:

```json
{
  "question": "What is supervised learning?"
}
```

Response:

```json
{
  "answer": "The most relevant transcript chunk appears here..."
}
```

### `GET /summary`

Returns a short summary of the currently loaded transcript.

Response:

```json
{
  "summary": "Short lecture summary appears here..."
}
```

## Future Improvements

- Add persistent storage for multiple videos
- Return timestamps with answers
- Improve scoring with TF-IDF or embeddings
- Add real LLM-based summaries when free credits or local models are available
- Add user sessions
- Add upload support for `.txt` transcript files
- Add CORS configuration for production frontend deployment
- Add tests for transcript fetching, chunking, Q&A, and summaries
- Add better language support for non-English captions

## Demo Guide for Judges

1. Start the backend:

```powershell
cd backend
npm install
npm start
```

2. Open the React frontend.

3. Paste a YouTube lecture URL.

4. Click the load button.

5. If captions are available, the app will show that the transcript is loaded.

6. If captions are unavailable, paste a short transcript manually and load again.

7. Ask a question such as:

```text
What is the main idea of this lecture?
```

8. Review the answer returned from the transcript.

9. Click the summary button to see a short lecture summary.

Recommended demo flow:

- Show automatic caption loading first.
- Ask one specific question from the lecture.
- Show the summary.
- Then show the manual transcript fallback to prove the app still works when YouTube captions are unavailable.

## Notes

This project is optimized for a hackathon MVP. The backend currently stores one loaded transcript in memory, so restarting the server clears the loaded video. This keeps the implementation simple and free while leaving a clear path for future upgrades.

// # RAG in oour project 


YouTube Video
       ↓
Transcript Extraction
       ↓
Transcript Chunking
       ↓
Store Chunks in Memory
       ↓
User Question
       ↓
Keyword Matching / Retrieval
       ↓
Find Best Chunk
       ↓
Return Answer

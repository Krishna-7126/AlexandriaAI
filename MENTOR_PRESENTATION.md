# AI Learning Companion - Mentor Presentation Notes

## One-Line Pitch

AI Learning Companion turns a lecture video or uploaded audio/video file into an interactive study assistant that can summarize the content, answer questions from the transcript, and jump to the exact video moment that supports the answer.

## Problem We Are Solving

Students often waste time scrubbing through long videos to find one concept, revise a topic, or confirm what the teacher said. Our app makes a video searchable and conversational, so learners can ask natural questions instead of manually rewatching everything.

## What The App Does

- Loads a YouTube URL or uploaded audio/video file.
- Extracts captions when YouTube captions are available.
- Falls back to AssemblyAI transcription when captions are missing and audio can be downloaded.
- Splits the transcript into timestamped chunks.
- Stores chunks in ChromaDB for retrieval.
- Uses Gemini for grounded LLM answers when an API key is configured.
- Uses local extractive fallback summaries when the LLM is unavailable.
- Shows transcript quality so users know whether answers are high confidence.
- Returns timestamps so the learner can jump back to the source moment.

## Wow Factor

- **Chat with a video:** The learner can ask, "What is the main idea?" or "Explain the concept at 2 minutes" and get an answer from the video content.
- **Evidence-based answers:** The system does not answer from random internet knowledge. It uses retrieved transcript chunks as context.
- **Jump-to-moment learning:** Every answer can include timestamps, turning the video player into a source citation.
- **Multiple ingestion paths:** It supports YouTube captions, YouTube auto subtitles, AssemblyAI transcription, and direct file upload.
- **Quality awareness:** The UI shows whether the transcript is strong or weak, which is important for honest AI output.
- **Session memory:** The same chat session can handle follow-up questions.
- **Graceful fallback:** If Gemini is disabled or fails, the app still gives local transcript-based summaries instead of crashing.

## Tech Stack

- **Frontend:** React, Vite, lucide-react icons, react-youtube.
- **Backend:** FastAPI and Pydantic.
- **Transcript sources:** youtube-transcript-api, yt-dlp subtitle extraction, AssemblyAI for speech-to-text.
- **Vector store:** ChromaDB.
- **Retrieval:** Sentence Transformers embeddings when enabled, plus keyword fallback.
- **LLM:** Gemini via `google-generativeai`.
- **Streaming:** `/ask/stream` returns NDJSON chunks so answers appear progressively in the chat.

## System Flow

1. User enters a YouTube URL or uploads a media file.
2. Backend extracts or generates a transcript.
3. Transcript is split into timestamped chunks.
4. Chunks are stored in ChromaDB with metadata like source, start time, end time, and quality score.
5. User asks a question.
6. Backend retrieves the most relevant transcript chunks.
7. Gemini answers using only those chunks.
8. Frontend streams the answer and displays clickable timestamps.

## Important Fixes Made

- Gemini now works automatically when an API key is present, unless explicitly disabled with `ENABLE_GEMINI=0`.
- The Gemini client now uses `gemini-2.5-flash` by default because the older `gemini-1.5-flash` endpoint was returning 404 in this environment.
- YouTube audio transcription now uses the installed `yt-dlp` Python package path before falling back to the module command.
- Metadata-only YouTube loads are no longer treated like real transcript Q&A.
- Streaming chat parsing is more reliable when network chunks split JSON lines.
- Transcript quality warnings are stored in a ChromaDB-safe format.

## Demo Script

1. Start the backend and frontend.
2. Load a YouTube video with captions or upload a short audio/video file.
3. Point out the transcript source, word count, chunk count, and quality panel.
4. Ask: "What is the main topic of this video?"
5. Click the timestamp returned with the answer.
6. Show overall summary, key topics, and last 5 minutes summary.
7. Explain that the answer is grounded in transcript retrieval, not hallucinated from general knowledge.

## Limitations To Mention Honestly

- YouTube videos without captions may require audio download and AssemblyAI transcription.
- Some YouTube videos block download/transcription, so file upload is the most reliable fallback.
- Transcript accuracy depends on captions or ASR quality.
- The app is designed for learning content, so it intentionally avoids inventing answers outside the transcript.

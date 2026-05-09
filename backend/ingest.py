import chromadb
import re
import importlib
import os
import subprocess
import tempfile
import shutil
from .utils.chunker import chunk_transcript
from .utils.transcript_loader import load_transcript
from .utils.transcript_store import store_chunks
from .utils.assemblyai_client import transcribe_uploaded_file, assemblyai_available, transcribe_file

_youtube_transcript_spec = importlib.util.find_spec("youtube_transcript_api")
if _youtube_transcript_spec is not None:
    YouTubeTranscriptApi = importlib.import_module("youtube_transcript_api").YouTubeTranscriptApi
else:
    YouTubeTranscriptApi = None


def _extract_youtube_id(url: str) -> str | None:
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11})(?:[&?]|$)",
        r"youtu\.be\/([0-9A-Za-z_-]{11})(?:[&?]|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _canonical_youtube_url(url: str) -> str:
    video_id = _extract_youtube_id(url)
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    return url


def _load_youtube_transcript(url: str):
    if not YouTubeTranscriptApi:
        print("YouTubeTranscriptApi not installed; skipping YouTube subtitle load.")
        return None
    video_id = _extract_youtube_id(url)
    if not video_id:
        return None
    try:
        # Newer versions expose `list_transcripts` as a classmethod
        if hasattr(YouTubeTranscriptApi, "list_transcripts"):
            print(f"Using YouTubeTranscriptApi.list_transcripts for {video_id}")
            transcripts = YouTubeTranscriptApi.list_transcripts(video_id)

            # Prefer manually created English, then generated English, then translations
            for finder in ("find_manually_created_transcript", "find_generated_transcript", "find_transcript"):
                if hasattr(transcripts, finder):
                    try:
                        t = getattr(transcripts, finder)(["en"])
                        return list(t.fetch())
                    except Exception:
                        pass

            for t in transcripts:
                try:
                    translated = t.translate("en")
                    entries = list(translated.fetch())
                    print(f"Translated transcript fetched: {len(entries)} entries")
                    return entries
                except Exception:
                    continue

            try:
                entries = YouTubeTranscriptApi.get_transcript(video_id)
                entries = list(entries)
                print(f"get_transcript returned {len(entries)} entries")
                return entries
            except Exception as e:
                print(f"YouTube subtitle load failed: {e}")
                return None

        # Older versions use instance methods `list` and `fetch`
        print(f"Falling back to instance API for {video_id}")
        api = YouTubeTranscriptApi()
        try:
            transcripts = api.list(video_id)
        except Exception:
            transcripts = None

        # If we got a TranscriptList, try to pick English or translated transcripts
        if transcripts is not None:
            # Try methods that may exist on TranscriptList
            for finder in ("find_manually_created_transcript", "find_generated_transcript", "find_transcript"):
                if hasattr(transcripts, finder):
                    try:
                        t = getattr(transcripts, finder)(["en"])
                        return list(t.fetch())
                    except Exception:
                        pass

            # Fallback: try to find an item with language 'en' or 'English' in its repr
            for t in transcripts:
                try:
                    if getattr(t, 'language_code', None) == 'en' or 'English' in str(t):
                        try:
                            entries = list(t.fetch())
                            print(f"Instance transcript fetched: {len(entries)} entries from {t}")
                            return entries
                        except Exception:
                            pass
                except Exception:
                    continue

        # Last resort: instance fetch (returns a reasonable transcript if available)
        try:
            entries = api.fetch(video_id)
            entries = list(entries)
            print(f"api.fetch returned {len(entries)} entries")
            return entries
        except Exception as e:
            print(f"YouTube subtitle load failed: {e}")
            return None
    except Exception as e:
        print(f"YouTube transcript listing failed: {e}")
        return None


def _get_entry_value(entry, key, default=""):
    if isinstance(entry, dict):
        return entry.get(key, default)
    return getattr(entry, key, default)


def _fast_mode_enabled() -> bool:
    return os.getenv("ENABLE_EMBEDDINGS", "0").strip().lower() in {"1", "true", "yes", "on"}


def _parse_timestamp(value: str) -> float:
    value = value.strip()
    match = re.match(r"(?:(\d+):)?(\d{2}):(\d{2})[\.,](\d{3})", value)
    if not match:
        return 0.0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    millis = int(match.group(4) or 0)
    return hours * 3600 + minutes * 60 + seconds + millis / 1000.0


def _parse_caption_file(path: str):
    entries = []
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as file_handle:
            text = file_handle.read()
    except Exception:
        return entries

    blocks = re.split(r"\n\s*\n", text)
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        time_line = None
        payload_lines = []
        for line in lines:
            if "-->" in line and time_line is None:
                time_line = line
            elif not line.isdigit() and not line.startswith("WEBVTT"):
                payload_lines.append(line)
        if not time_line:
            continue
        try:
            start_raw, end_raw = [part.strip().split(" ")[0] for part in time_line.split("-->")[:2]]
            start = _parse_timestamp(start_raw)
            end = _parse_timestamp(end_raw)
            payload = " ".join(payload_lines).strip()
            if payload:
                entries.append({"text": payload, "start": start, "duration": max(0.5, end - start)})
        except Exception:
            continue
    return entries


def _load_youtube_subtitles(url: str):
    """Try yt-dlp subtitle download before heavier transcription paths."""
    try:
        import yt_dlp  # type: ignore
    except Exception:
        yt_dlp = None

    temp_dir = tempfile.mkdtemp(prefix="alc_subs_")
    try:
        if yt_dlp is not None:
            ydl_opts = {
                "skip_download": True,
                "writesubtitles": True,
                "writeautomaticsub": True,
                "subtitleslangs": ["en", "en-US", "en-GB"],
                "subtitlesformat": "vtt",
                "outtmpl": os.path.join(temp_dir, "%(id)s.%(ext)s"),
                "quiet": True,
                "no_warnings": True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                video_id = info.get("id", "video")
        else:
            video_id = "video"
            subprocess.run([
                "python", "-m", "yt_dlp",
                "--skip-download",
                "--write-subs",
                "--write-auto-subs",
                "--sub-langs", "en,en-US,en-GB",
                "--sub-format", "vtt",
                "-o", os.path.join(temp_dir, "%(id)s.%(ext)s"),
                url,
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        subtitle_files = []
        for root, _dirs, files in os.walk(temp_dir):
            for file_name in files:
                if file_name.endswith(('.vtt', '.srt')):
                    subtitle_files.append(os.path.join(root, file_name))

        for subtitle_file in subtitle_files:
            entries = _parse_caption_file(subtitle_file)
            if entries:
                print(f"Loaded {len(entries)} caption entries from {subtitle_file}")
                return entries
    except Exception as e:
        print(f"yt-dlp subtitle fallback failed: {e}")
    finally:
        try:
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass
    return None


def _load_youtube_metadata(url: str) -> dict | None:
    try:
        result = subprocess.run(
            ["yt-dlp", "--dump-single-json", "--skip-download", url],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        import json

        return json.loads(result.stdout)
    except Exception as e:
        print(f"yt-dlp metadata fallback failed: {e}")
        return None


def _download_youtube_audio(url: str) -> str | None:
    temp_dir = tempfile.mkdtemp(prefix="alc_audio_")
    output_template = os.path.join(temp_dir, "%(id)s.%(ext)s")
    try:
        try:
            import yt_dlp  # type: ignore

            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": output_template,
                "quiet": True,
                "no_warnings": True,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "128",
                    }
                ],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.extract_info(url, download=True)
        except Exception as package_error:
            print(f"yt-dlp package audio download failed: {package_error}; trying module command")
            subprocess.run(
                [
                    "python",
                    "-m",
                    "yt_dlp",
                    "-x",
                    "--audio-format",
                    "mp3",
                    "--audio-quality",
                    "128K",
                    "-o",
                    output_template,
                    url,
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

        audio_files = []
        for root, _dirs, files in os.walk(temp_dir):
            for file_name in files:
                if file_name.lower().endswith((".mp3", ".m4a", ".webm", ".wav", ".ogg")):
                    audio_files.append(os.path.join(root, file_name))
        if not audio_files:
            shutil.rmtree(temp_dir, ignore_errors=True)
            return None

        source_path = audio_files[0]
        fd, stable_path = tempfile.mkstemp(prefix="alc_audio_", suffix=os.path.splitext(source_path)[1] or ".mp3")
        os.close(fd)
        shutil.copyfile(source_path, stable_path)
        shutil.rmtree(temp_dir, ignore_errors=True)
        return stable_path
    except Exception as e:
        print(f"yt-dlp audio fallback failed: {e}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        return None


def _create_segments_from_entries(entries):
    segments = []
    for entry in entries:
        text = str(_get_entry_value(entry, "text", "")).strip()
        if not text:
            continue
        start = float(_get_entry_value(entry, "start", 0.0) or 0.0)
        duration = float(_get_entry_value(entry, "duration", 0.0) or 0.0)
        end = start + duration if duration > 0 else start + 2.0
        segments.append({"text": text, "start": start, "end": end})
    return segments


def _create_segments_from_assemblyai(result):
    words = result.get("words") or []
    segments = []
    if words:
        current_words = []
        segment_start = None
        segment_end = None
        for word in words:
            text = str(word.get("text", "")).strip()
            if not text:
                continue
            if segment_start is None:
                segment_start = float(word.get("start", 0.0) or 0.0)
            segment_end = float(word.get("end", segment_start or 0.0) or 0.0)
            current_words.append(text)
            if len(current_words) >= 40:
                segments.append(
                    {
                        "text": " ".join(current_words).strip(),
                        "start": segment_start or 0.0,
                        "end": segment_end or (segment_start or 0.0) + 2.0,
                    }
                )
                current_words = []
                segment_start = None
                segment_end = None
        if current_words:
            segments.append(
                {
                    "text": " ".join(current_words).strip(),
                    "start": segment_start or 0.0,
                    "end": segment_end or (segment_start or 0.0) + 2.0,
                }
            )

    if not segments:
        transcript_text = str(result.get("text", "")).strip()
        if transcript_text:
            segments = [{"text": transcript_text, "start": 0.0, "end": max(2.0, len(transcript_text.split()) * 0.5)}]

    return segments


def _assess_transcript_quality(transcript: str, segments: list[dict], source: str, method: str) -> dict:
    text = (transcript or "").strip()
    words = text.split()
    unique_ratio = len({w.lower().strip('.,!?;:"\'()[]{}') for w in words if w.strip()}) / max(1, len(words)) if words else 0.0
    warnings = []
    if not text:
        warnings.append("Empty transcript")
    if len(words) < 120:
        warnings.append("Short transcript")
    if len(segments) < 3:
        warnings.append("Few transcript chunks")
    if unique_ratio < 0.25 and len(words) >= 40:
        warnings.append("Highly repetitive transcript")
    if source == "unknown":
        warnings.append("Transcript source unknown")
    if source in {"youtube_metadata", "url_only"}:
        warnings.append("No real transcript was available")

    if not warnings:
        score = "high"
    elif len(warnings) == 1:
        score = "medium"
    else:
        score = "low"

    return {
        "score": score,
        "warnings": warnings,
        "word_count": len(words),
        "chunk_count": len(segments),
        "unique_ratio": round(unique_ratio, 3),
    }


def ingest_transcript(transcript, video_id, segments, source="unknown", method="unknown"):
    if not transcript:
        transcript = load_transcript()
    if not segments:
        segments = [{"text": transcript, "start": 0.0, "end": max(2.0, len(transcript.split()) * 0.5)}]

    quality = _assess_transcript_quality(transcript, segments, source, method)

    chunks = chunk_transcript(transcript, segments)
    embeddings = None
    if _fast_mode_enabled():
        try:
            from sentence_transformers import SentenceTransformer
            model_emb = SentenceTransformer('all-MiniLM-L6-v2')
            embeddings = model_emb.encode([c['text'] for c in chunks])
        except Exception as e:
            print(f"Embeddings failed: {e}, using keyword fallback")
            embeddings = None

    try:
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_or_create_collection(name="transcripts")
        try:
            collection.delete(where={"video_id": video_id})
        except Exception:
            pass

        ids = [f"{video_id}_{i}" for i in range(len(chunks))]
        documents = [chunk['text'] for chunk in chunks]
        metadatas = [
            {
                "text": chunk['text'],
                "start_time": chunk['start'],
                "end_time": chunk['end'],
                "video_id": video_id,
                "source": source,
                "method": method,
                "quality_score": quality["score"],
                "quality_warnings": "; ".join(quality["warnings"]),
                "word_count": quality["word_count"],
                "chunk_count": quality["chunk_count"],
                "unique_ratio": quality["unique_ratio"],
            }
            for chunk in chunks
        ]

        if embeddings is not None and len(embeddings) != len(ids):
            print(f"Embedding length {len(embeddings)} != chunks {len(ids)}, dropping embeddings")
            embeddings = None

        if embeddings is not None:
            collection.add(ids=ids, embeddings=[[float(value) for value in embedding] for embedding in embeddings], documents=documents, metadatas=metadatas)
        else:
            collection.add(ids=ids, documents=documents, metadatas=metadatas)
    except Exception as e:
        print(f"ChromaDB failed: {e}, storing in memory")
        store_chunks(video_id, [
            {
                "text": chunk['text'],
                "start_time": chunk['start'],
                "end_time": chunk['end'],
                "video_id": video_id,
                "source": source,
                "method": method,
                "quality_score": quality["score"],
                "quality_warnings": quality["warnings"],
            }
            for chunk in chunks
        ])


    return {
        "video_id": video_id,
        "chunk_count": len(chunks),
        "transcript_length": len(transcript.split()) if transcript else 0,
        "quality": quality,
        "source": source,
        "method": method,
    }


def ingest_assemblyai_file(file_bytes: bytes, file_name: str, video_id: str):
    if not assemblyai_available():
        raise RuntimeError("AssemblyAI is not configured. Set ASSEMBLYAI_API_KEY in .env.")
    result = transcribe_uploaded_file(file_bytes, file_name)
    transcript = str(result.get("text", "")).strip()
    segments = _create_segments_from_assemblyai(result)
    payload = ingest_transcript(transcript, video_id, segments, source="upload", method="assemblyai_file")
    payload.update({"source": "upload", "method": "assemblyai_file"})
    return payload


def ingest_video(video_url, video_id):
    transcript = None
    segments = []
    source = "unknown"
    canonical_url = _canonical_youtube_url(video_url)
    if video_url and ("youtube.com" in video_url or "youtu.be" in video_url):
        entries = _load_youtube_transcript(canonical_url)
        if entries:
            segments = _create_segments_from_entries(entries)
            transcript = " ".join([seg["text"] for seg in segments])
            source = "youtube_captions"
    # If we couldn't obtain a transcript from YouTube, avoid silently falling back
    # to a demo transcript. Ask the caller to provide a file or configure a
    # transcription provider instead.
    if not transcript:
        # Fast fallback: try auto subtitles via yt-dlp before expensive ASR.
        entries = _load_youtube_subtitles(canonical_url)
        if entries:
            segments = _create_segments_from_entries(entries)
            transcript = " ".join([seg["text"] for seg in segments])
            source = "youtube_auto_subtitles"

    if not transcript:
        # Try to transcribe audio via AssemblyAI if configured.
        if assemblyai_available():
            tmp_path = None
            try:
                tmp_path = _download_youtube_audio(canonical_url)
                if tmp_path:
                    print(f"Downloaded audio to {tmp_path} for transcription")
                    result = transcribe_file(tmp_path)
                    transcript = str(result.get("text", "")).strip()
                    segments = _create_segments_from_assemblyai(result)
                    source = "assemblyai_audio"
                else:
                    print("No audio file could be downloaded for AssemblyAI transcription")
            except Exception as e:
                print(f"yt-dlp/AssemblyAI path failed: {e}")
                transcript = None
            finally:
                try:
                    if tmp_path and os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass

        # If still no transcript, instruct the user to upload a file or configure tools
        if not transcript:
            metadata = _load_youtube_metadata(canonical_url) if video_url else None
            if metadata:
                title = metadata.get("title") or "Unknown title"
                description = metadata.get("description") or ""
                uploader = metadata.get("uploader") or metadata.get("channel") or "Unknown channel"
                tags = metadata.get("tags") or []
                pieces = [
                    f"Video title: {title}",
                    f"Channel: {uploader}",
                ]
                if description:
                    pieces.append(f"Description: {description[:1000]}")
                if tags:
                    pieces.append(f"Tags: {', '.join(tags[:20])}")
                transcript = "\n".join(pieces)
                segments = [{"text": transcript, "start": 0.0, "end": 4.0}]
                source = "youtube_metadata"
            else:
                # Last-resort fast fallback: ingest a compact structural placeholder rather than erroring.
                transcript = f"Video source: {canonical_url}. No captions were available, but the app processed the video link for follow-up Q&A."
                segments = [{"text": transcript, "start": 0.0, "end": 2.0}]
                source = "url_only"

    payload = ingest_transcript(transcript, video_id, segments, source=source, method=source)
    payload.update({"source": source, "method": source})
    return payload

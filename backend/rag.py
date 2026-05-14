import os
import re
from .utils.similarity import keyword_similarity
from .utils.transcript_store import get_chunks
from .utils.gemini_client import generate_text, gemini_available
from .utils.summary_helper import extractive_summary
from .utils.education_ai import analyze_educational_content, build_qa_bundle


def _embeddings_enabled() -> bool:
    return os.getenv("ENABLE_EMBEDDINGS", "0").strip().lower() in {"1", "true", "yes", "on"}


def _chroma_enabled() -> bool:
    return os.getenv("ENABLE_CHROMA", "0").strip().lower() in {"1", "true", "yes", "on"}


def _format_context(chunks):
    lines = []
    for i, chunk in enumerate(chunks, start=1):
        start = chunk.get('start', chunk.get('start_time', 0))
        end = chunk.get('end', chunk.get('end_time', 0))
        lines.append(f"[{i}] ({start:.2f}-{end:.2f}s) {chunk.get('text', '').strip()}")
    return "\n".join(lines)


def _build_answer_prompt(question, context, history):
    history_text = ""
    if history:
        turns = []
        for item in history[-4:]:
            turns.append(f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}")
        history_text = "\n\nPrevious conversation:\n" + "\n\n".join(turns)
    return (
        "You are Alexandria, an expert educational tutor for learners.\n"
        "Use the transcript context, educational analysis, and conversation history to answer with real understanding.\n"
        "Do not echo the transcript verbatim. Explain the idea in plain language, define key terms, and connect the answer to the underlying concept.\n"
        "If the answer is partially supported, say what is supported and what is uncertain. If the transcript does not support the answer, say so clearly and suggest the next concept to study.\n"
        "Write in a helpful teaching style with this structure when possible:\n"
        "1. Direct answer\n"
        "2. Why this is true\n"
        "3. Evidence from the transcript\n"
        "4. What to remember next\n\n"
        f"TRANSCRIPT CONTEXT:\n{context}\n\n"
        f"QUESTION: {question}\n"
        f"{history_text}\n\n"
        "ANSWER:"
    )


def _build_quality_guidance(quality_score: str, quality_warnings: list[str]) -> str:
    if quality_score == "low":
        detail = "; ".join(str(w) for w in quality_warnings[:3])
        return (
            "Transcript quality is low. Be careful, brief, and explicitly note uncertainty. "
            f"If useful, mention these warnings: {detail}."
        )
    if quality_score == "medium":
        return "Transcript quality is moderate. Be concise and include a small uncertainty note if the answer is not fully supported."
    return "Transcript quality is high. Answer normally, but stay grounded in the transcript."


def _coerce_warnings(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        return [part.strip() for part in value.split(";") if part.strip()]
    return []


def ask_question(video_id, question, history=[]):
    try:
        # Log AI status
        if not gemini_available():
            print(f"⚠️  Gemini not available. Using local extractive fallback (less sophisticated but functional)")
        
        qa_bundle = build_qa_bundle(video_id, question, history or [], limit=4)
        analysis = qa_bundle.get("analysis", analyze_educational_content(video_id))
        texts = qa_bundle.get("chunks", [])
        embeddings = None
    except Exception as e:
        print(f"Educational QA bundle failed: {e}, using fallback")
        texts = get_chunks(video_id)
        analysis = analyze_educational_content(video_id)
        embeddings = None

    if not texts:
        return (
            "I could not find transcript data for that video yet. Please ingest a video first.",
            [0, 0],
        )

    best_idx = 0
    top_indices = [0]
    if embeddings and _embeddings_enabled():
        try:
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            model_emb = SentenceTransformer('all-MiniLM-L6-v2')
            q_emb = model_emb.encode([question])[0]
            similarities = cosine_similarity([q_emb], embeddings)[0]
            best_idx = int(np.argmax(similarities))
            top_indices = list(np.argsort(similarities)[::-1][:3])
        except Exception as e:
            print(f"Embedding QA failed: {e}, falling back to text matching")
            embeddings = None

    if embeddings is None and _embeddings_enabled():
        try:
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            model_emb = SentenceTransformer('all-MiniLM-L6-v2')
            text_embs = model_emb.encode([t['text'] for t in texts])
            q_emb = model_emb.encode([question])[0]
            similarities = cosine_similarity([q_emb], text_embs)[0]
            best_idx = int(np.argmax(similarities))
            top_indices = list(np.argsort(similarities)[::-1][:3])
        except Exception as e:
            print(f"Text embedding failed: {e}, using keyword matching")
            scored = sorted(
                enumerate(texts),
                key=lambda item: keyword_similarity(question, item[1].get('text', '')),
                reverse=True,
            )
            if scored:
                best_idx = scored[0][0]
                top_indices = [index for index, _chunk in scored[:3]]
    elif embeddings is None or not _embeddings_enabled():
        scored = sorted(
            enumerate(texts),
            key=lambda item: keyword_similarity(question, item[1].get('text', '')),
            reverse=True,
        )
        if scored:
            best_idx = scored[0][0]
            top_indices = [index for index, _chunk in scored[:3]]

    selected_chunks = [texts[i] for i in top_indices if i < len(texts)] or [texts[best_idx]]
    best_chunk = selected_chunks[0]
    timestamps = [best_chunk.get('start', best_chunk.get('start_time', 0)), best_chunk.get('end', best_chunk.get('end_time', 0))]

    smart_timestamps = analysis.get("smart_timestamps", []) if isinstance(analysis, dict) else []
    if smart_timestamps:
        best_time = float(best_chunk.get('start_time', best_chunk.get('start', 0)) or 0)
        closest = min(
            smart_timestamps,
            key=lambda item: abs(float(item.get('timestamp', item.get('time', 0)) or 0) - best_time),
            default=None,
        )
        if closest:
            timestamps = [float(closest.get('timestamp', closest.get('time', 0)) or 0), float(best_chunk.get('end', best_chunk.get('end_time', 0)) or 0)]

    source = str(best_chunk.get('source', '')).lower()
    if source in {"youtube_metadata", "url_only"}:
        return (
            "I could not answer from the actual video speech because no real transcript was available. "
            "I only have YouTube metadata for this link. Try a video with captions, upload the video/audio file, "
            "or use the AssemblyAI transcription path so I can answer from spoken content.",
            timestamps,
        )

    quality_score = str(best_chunk.get('quality_score', 'unknown')).lower()
    quality_warnings = _coerce_warnings(best_chunk.get('quality_warnings'))
    quality_note = ""
    if quality_score == "low":
        quality_note = "Note: this answer is based on a low-confidence transcript, so it may be incomplete or approximate.\n\n"
    elif quality_score == "medium":
        quality_note = "Note: this answer is based on a moderate-confidence transcript.\n\n"

    context = _format_context(selected_chunks[:5])
    educational_context = analysis.get('qa_guidance', '') if isinstance(analysis, dict) else ''
    if analysis and isinstance(analysis, dict):
        concept_lines = []
        for concept in analysis.get('key_concepts', [])[:5]:
            if isinstance(concept, dict):
                concept_lines.append(
                    f"- {concept.get('name', 'Concept')} @ {concept.get('timestamp', 0)}s: {concept.get('why_it_matters', '')}"
                )
        if concept_lines:
            educational_context = educational_context + "\nKey concepts:\n" + "\n".join(concept_lines)
        objectives = analysis.get('learning_objectives', [])[:4]
        if objectives:
            educational_context += "\nLearning objectives:\n" + "\n".join(f"- {item}" for item in objectives)
    answer = None
    if gemini_available():
        prompt = _build_answer_prompt(question, f"{educational_context}\n\n{context}".strip(), history)
        quality_guidance = _build_quality_guidance(quality_score, quality_warnings)
        prompt = (
            f"{quality_guidance}\n\n"
            f"Give a detailed but readable answer. When useful, include a concrete example, analogy, or step-by-step breakdown.\n\n"
            f"{prompt}"
        )
        try:
            model_name = os.getenv("GEMINI_QA_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-pro"))
            answer = generate_text(prompt, temperature=0.25, max_output_tokens=700, model_name=model_name)
        except Exception as e:
            print(f"Gemini QA failed: {e}")

    if not answer:
        # Create a smarter local answer by synthesizing the selected chunks
        try:
            combined = ' '.join([c.get('text', '') for c in selected_chunks])
            core_answer = extractive_summary(combined, num_sentences=3)
            
            # Generate a smarter synthesis using the educational context
            if core_answer:
                answer = core_answer
                # Add synthesis based on key concepts if available
                key_concepts = analysis.get('key_concepts', []) if isinstance(analysis, dict) else []
                best_start = best_chunk.get('start_time', best_chunk.get('start', 0)) or 0
                best_end = best_chunk.get('end_time', best_chunk.get('end', 0)) or 0
                
                relevant_concepts = [
                    c for c in key_concepts 
                    if isinstance(c, dict) and (
                        best_start - 30 <= float(c.get('timestamp', c.get('time', 0)) or 0) <= best_end + 30
                    )
                ]
                
                if relevant_concepts:
                    concept_names = [c.get('name', '') for c in relevant_concepts if c.get('name')]
                    why_matters_list = [c.get('why_it_matters', '') for c in relevant_concepts if c.get('why_it_matters')]
                    if concept_names and why_matters_list:
                        answer = f"{core_answer}\n\nThis connects to: {', '.join(concept_names)}. {' '.join(why_matters_list[:2])}"
        except Exception as e:
            print(f"Fallback synthesis failed: {e}")
            answer = best_chunk.get('text', '').strip()
    if not answer:
        answer = "I found a relevant section, but the transcript chunk is empty."

    if answer:
        answer = re.sub(r"\n{3,}", "\n\n", str(answer)).strip()
        if not any(marker in answer.lower() for marker in ["direct answer", "why this is true", "evidence from the transcript"]):
            answer = (
                f"Direct answer:\n{answer}\n\n"
                "Why this is true:\nThe answer is grounded in the transcript context that matched your question.\n\n"
                "What to remember next:\nFocus on the concept tied to the highlighted timestamp to retain the bigger idea."
            )

    if quality_note and answer:
        answer = f"{quality_note}{answer}"
        if quality_warnings:
            answer += "\n\nTranscript warnings: " + "; ".join(str(w) for w in quality_warnings[:3])

    return answer, timestamps

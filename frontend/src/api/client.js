const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
const analysisCache = new Map();
const analysisInFlight = new Map();

// Get JWT token from localStorage
function getAuthToken() {
  return localStorage.getItem('alexandria_token');
}

// Get auth headers with JWT token
function getAuthHeaders() {
  const token = getAuthToken();
  return token
    ? { 'Authorization': `Bearer ${token}` }
    : {};
}

async function parseResponse(response, fallbackMessage) {
  const result = await response.json().catch(() => ({}));
  if (response.ok) {
    return result;
  }
  
  // Handle 401 - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('alexandria_token');
    localStorage.removeItem('alexandria_user');
    window.location.href = '/auth/login';
  }
  
  throw new Error(result.detail || result.message || fallbackMessage);
}

export async function ingestVideo(videoUrl) {
  try {
    const response = await fetch(`${API_BASE}/ingest`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ video_url: videoUrl })
    });
    return await parseResponse(response, 'Failed to ingest video');
  } catch (error) {
    throw new Error(`Backend unreachable at ${API_BASE}. Start the API server and try again.`, { cause: error });
  }
}

export async function ingestFile(file, title = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }

  try {
    const response = await fetch(`${API_BASE}/ingest-file`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return await parseResponse(response, 'Failed to ingest file');
  } catch (error) {
    throw new Error(`Backend unreachable at ${API_BASE}. Start the API server and try again.`, { cause: error });
  }
}

export async function getIngestStatus(jobId) {
  const response = await fetch(`${API_BASE}/ingest-status/${jobId}`);
  return await parseResponse(response, 'Failed to get ingest status');
}

export async function getAnalysis(videoId) {
  const cached = analysisCache.get(videoId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (analysisInFlight.has(videoId)) {
    return analysisInFlight.get(videoId);
  }

  const request = (async () => {
  const response = await fetch(`${API_BASE}/analysis/${videoId}`, {
    headers: getAuthHeaders()
  });
  if (response.ok) {
    const data = await response.json();
    const value = {
      educational_score: data.educational_score ?? 0,
      teaching_mode: data.teaching_mode ?? 'mixed',
      learning_objectives: Array.isArray(data.learning_objectives) ? data.learning_objectives : [],
      key_concepts: Array.isArray(data.key_concepts) ? data.key_concepts : [],
      ...data,
    };
    analysisCache.set(videoId, { value, expiresAt: Date.now() + 5000 });
    return value;
  }

  if (response.status !== 404) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || result.message || 'Failed to get analysis');
  }

  const [overall, topics, recent, timestamps, quality] = await Promise.all([
    getOverallSummary(videoId).catch(() => null),
    getTopicSummaries(videoId).catch(() => null),
    getLastMinutesSummary(videoId, 5).catch(() => null),
    getTimestamps(videoId).catch(() => null),
    getQuality(videoId).catch(() => null),
  ]);

  const summary = overall?.summary || 'Summary is not available yet. Please ingest a video first.';
  const topicList = Array.isArray(topics?.topics) ? topics.topics : [];
  const timestampList = Array.isArray(timestamps?.timestamps) ? timestamps.timestamps : [];
  const ready = !summary.startsWith('Summary is not available yet') || topicList.length > 0 || timestamps?.status === 'success';

  return {
    video_id: videoId,
    summary,
    topics: topicList,
    recent_summary: recent?.summary,
    recent_timestamp: recent?.timestamp,
    timestamps: timestampList,
    quality: quality?.quality,
    educational_score: 0,
    teaching_mode: 'mixed',
    learning_objectives: [],
    key_concepts: [],
    status: ready ? 'success' : 'processing',
  };
  })();

  analysisInFlight.set(videoId, request);

  try {
    return await request;
  } finally {
    analysisInFlight.delete(videoId);
  }
}

export async function getOverallSummary(videoId) {
  const response = await fetch(`${API_BASE}/summary/${videoId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get summary');
  return await response.json();
}

export async function getTopicSummaries(videoId) {
  const response = await fetch(`${API_BASE}/topic-summaries/${videoId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get topic summaries');
  return await response.json();
}

export async function getLastMinutesSummary(videoId, minutes = 5) {
  const response = await fetch(`${API_BASE}/last-minutes/${videoId}?minutes=${minutes}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get recent summary');
  return await response.json();
}

export async function getTimestamps(videoId) {
  const response = await fetch(`${API_BASE}/timestamps/${videoId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get timestamps');
  return await response.json();
}

export async function getQuality(videoId) {
  const response = await fetch(`${API_BASE}/quality/${videoId}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to get quality');
  return await response.json();
}

export async function generateQuiz(videoId, numQuestions = 5, userId = null, sessionId = null) {
  const params = new URLSearchParams();
  params.set('num_questions', String(numQuestions));
  if (userId) params.set('user_id', userId);
  if (sessionId) params.set('session_id', sessionId);

  const response = await fetch(`${API_BASE}/v3/quiz/generate/${videoId}?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to generate quiz');
}

export async function getNextQuiz(videoId = null, userId = null, sessionId = null) {
  const params = new URLSearchParams();
  if (videoId) params.set('video_id', videoId);
  if (userId) params.set('user_id', userId);
  if (sessionId) params.set('session_id', sessionId);

  const response = await fetch(`${API_BASE}/v3/quiz/get-next?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get next quiz question');
}

export async function submitQuizAnswer(questionId, answer, userId = null, sessionId = null) {
  const response = await fetch(`${API_BASE}/v3/quiz/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      question_id: questionId,
      answer,
      user_id: userId,
      session_id: sessionId,
    }),
  });
  return await parseResponse(response, 'Failed to submit quiz answer');
}

export async function getQuizPerformance(videoId = null, userId = null, sessionId = null) {
  const params = new URLSearchParams();
  if (videoId) params.set('video_id', videoId);
  if (userId) params.set('user_id', userId);
  if (sessionId) params.set('session_id', sessionId);

  const response = await fetch(`${API_BASE}/v3/quiz/performance?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get quiz performance');
}

export async function generateCustomQuiz(videoId, startTime, endTime, numQuestions = 5) {
  const params = new URLSearchParams();
  params.set('start_time', String(startTime));
  params.set('end_time', String(endTime));
  params.set('num_questions', String(numQuestions));

  const response = await fetch(`${API_BASE}/v3/quiz/generate-window/${videoId}?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return await parseResponse(response, 'Failed to generate custom quiz');
}

// Helper to handle the NDJSON streaming response from /ask/stream
export async function askQuestionStream(videoId, question, sessionId, onChunk, onTimestamps, onDone, onError) {
  try {
    const response = await fetch(`${API_BASE}/ask/stream`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        video_id: videoId,
        question: question,
        session_id: sessionId
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Streaming failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.chunk) {
            onChunk(json.chunk);
          }
          if (json.timestamps && json.timestamps.length > 0) {
            onTimestamps(json.timestamps);
          }
        } catch {
          console.warn('Failed to parse NDJSON line:', line);
        }
      }
    }
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        if (json.chunk) onChunk(json.chunk);
        if (json.timestamps && json.timestamps.length > 0) onTimestamps(json.timestamps);
      } catch {
        console.warn('Failed to parse final NDJSON line:', buffer);
      }
    }
    onDone();
  } catch (error) {
    onError(error);
  }
}

// ===== NEW AUTH FUNCTIONS =====

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get user info');
}

export async function updateUserPreferences(preferences) {
  const response = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(preferences)
  });
  return await parseResponse(response, 'Failed to update preferences');
}

// ===== NEW LIBRARY FUNCTIONS =====

export async function saveVideo(videoId, title, collectionId = null) {
  const response = await fetch(`${API_BASE}/library/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      video_id: videoId,
      title,
      collection_id: collectionId
    })
  });
  return await parseResponse(response, 'Failed to save video');
}

export async function getLibrary() {
  const response = await fetch(`${API_BASE}/library`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get library');
}

export async function deleteFromLibrary(savedVideoId) {
  const response = await fetch(`${API_BASE}/library/${savedVideoId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to delete from library');
}

// ===== EXPORT FUNCTIONS =====

export async function exportContent(videoId, contentType, exportFormat) {
  const response = await fetch(`${API_BASE}/features/export/summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      video_id: videoId,
      video_title: contentType,
      export_type: exportFormat,
      include_qa_history: false
    })
  });
  return await parseResponse(response, 'Failed to export content');
}

// ===== LANGUAGE FUNCTIONS =====

export async function getSupportedLanguages() {
  const response = await fetch(`${API_BASE}/features/languages`);
  if (!response.ok) throw new Error('Failed to get languages');
  return await response.json();
}

export async function translateContent(videoId, targetLanguage) {
  const response = await fetch(`${API_BASE}/features/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      video_id: videoId,
      target_language: targetLanguage
    })
  });
  return await parseResponse(response, 'Failed to translate content');
}

// ===== ANALYTICS FUNCTIONS =====

export async function getAnalyticsDashboard() {
  const response = await fetch(`${API_BASE}/analytics/dashboard`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get analytics');
}

export async function getVideoAnalytics(videoId) {
  const response = await fetch(`${API_BASE}/analytics/video/${videoId}`, {
    headers: getAuthHeaders()
  });
  return await parseResponse(response, 'Failed to get video analytics');
}

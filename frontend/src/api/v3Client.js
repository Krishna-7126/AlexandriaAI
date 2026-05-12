const BASE = window.__ALEXANDRIA_API_BASE__ || '';

function timeoutFetch(url, opts = {}, ms = 15000) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

const cache = new Map();

export function clearVideoCache(videoId) {
  for (const key of cache.keys()) {
    if (key.includes(`:${videoId}`)) {
      cache.delete(key);
    }
  }
}

export async function getAnalysisStatus(videoId, start = false) {
  const res = await timeoutFetch(`${BASE}/v3/analyze/status/${videoId}?start=${start ? 'true' : 'false'}`, {}, 10000);
  if (!res.ok) throw new Error('Failed to fetch analysis status');
  return res.json();
}

export async function getObjectives(videoId) {
  const key = `v3:objectives:${videoId}`;
  if (cache.has(key)) return cache.get(key);
  const res = await timeoutFetch(`${BASE}/v3/objectives/${videoId}`);
  if (!res.ok) throw new Error('Failed to fetch objectives');
  const json = await res.json();
  cache.set(key, json);
  return json;
}

export async function getStudyNotes(videoId) {
  const key = `v3:notes:${videoId}`;
  if (cache.has(key)) return cache.get(key);
  const res = await timeoutFetch(`${BASE}/v3/study-notes/${videoId}`);
  if (!res.ok) throw new Error('Failed to fetch study notes');
  const json = await res.json();
  cache.set(key, json);
  return json;
}

export async function getConcepts(videoId) {
  const key = `v3:concepts:${videoId}`;
  if (cache.has(key)) return cache.get(key);
  const res = await timeoutFetch(`${BASE}/v3/concepts/${videoId}`);
  if (!res.ok) throw new Error('Failed to fetch concepts');
  const json = await res.json();
  cache.set(key, json);
  return json;
}

export async function getSummaries(videoId, level = 'standard') {
  const key = `v3:summaries:${videoId}:${level}`;
  if (cache.has(key)) return cache.get(key);
  const res = await timeoutFetch(`${BASE}/v3/summaries/${videoId}?level=${level}`);
  if (!res.ok) throw new Error('Failed to fetch summaries');
  const json = await res.json();
  cache.set(key, json);
  return json;
}

export async function getAnalytics(userId) {
  const res = await timeoutFetch(`${BASE}/analytics/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export default {
  getObjectives,
  getStudyNotes,
  getConcepts,
  getSummaries,
  getAnalytics,
  getAnalysisStatus,
  clearVideoCache,
};

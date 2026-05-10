/* ============================================================
   Alexandria Extension – Content Script
   Runs directly on youtube.com
   Communicates with the local FastAPI backend (localhost:8000)
   ============================================================ */

const API_BASE = 'http://localhost:8000';

let sidebar = null;
let fab = null;
let isOpen = false;
let currentVideoId = null;
let chatHistory = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getYouTubeId(url) {
  try {
    const u = new URL(url || window.location.href);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname === 'youtu.be')          return u.pathname.slice(1);
  } catch (_) {}
  return null;
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function seekYouTube(seconds) {
  const video = document.querySelector('video');
  if (video) video.currentTime = seconds;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function ingestUrl(videoUrl) {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl })
  });
  if (!res.ok) throw new Error(`Ingest failed: ${res.statusText}`);
  return res.json();
}

async function pollJob(jobId, onProgress) {
  const max = 180;
  for (let i = 0; i < max; i++) {
    const res = await fetch(`${API_BASE}/ingest/status/${jobId}`);
    if (!res.ok) throw new Error('Status check failed');
    const job = await res.json();
    onProgress(job.progress || Math.min(10 + i * 0.5, 95), job.step_name || 'Processing…');
    if (job.status === 'completed' || job.status === 'failed') return job;
    await new Promise(r => setTimeout(r, 600));
  }
  throw new Error('Timed out');
}

async function getSummary(videoId) {
  const res = await fetch(`${API_BASE}/videos/${videoId}/summary`);
  if (!res.ok) return null;
  return res.json();
}

async function getTimeline(videoId) {
  const res = await fetch(`${API_BASE}/videos/${videoId}/chapters`);
  if (!res.ok) return null;
  return res.json();
}

async function sendChatMessage(videoId, message) {
  const res = await fetch(`${API_BASE}/videos/${videoId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: chatHistory })
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

// ─── Build UI ─────────────────────────────────────────────────────────────────

function buildSidebar() {
  // FAB button
  fab = document.createElement('div');
  fab.id = 'alexandria-fab';
  fab.title = 'Toggle Alexandria AI';
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>`;
  fab.addEventListener('click', toggleSidebar);
  document.body.appendChild(fab);

  // Sidebar shell
  sidebar = document.createElement('div');
  sidebar.id = 'alexandria-extension-root';
  sidebar.innerHTML = `
    <!-- Header -->
    <div id="alexandria-header">
      <div id="alexandria-header-brand">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Alexandria</span>
      </div>
      <button id="alexandria-analyze-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Analyze
      </button>
      <div id="alexandria-close-btn" title="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </div>
    </div>

    <!-- Progress Bar -->
    <div id="alexandria-progress-bar-container">
      <div id="alexandria-progress-bar"></div>
    </div>

    <!-- Status -->
    <div id="alexandria-status">
      <div class="alex-spinner"></div>
      <span id="alexandria-status-text">Starting…</span>
    </div>

    <!-- Idle -->
    <div id="alexandria-idle">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <h3>Alexandria AI</h3>
      <p>Click <strong>Analyze</strong> to summarize this YouTube video with AI — directly here, without leaving the page.</p>
      <p style="font-size:0.75rem; color:#9ca3af; margin-top:4px;">Make sure your backend is running at localhost:8000</p>
    </div>

    <!-- Result Content -->
    <div id="alexandria-content">

      <!-- Video Title -->
      <div class="alex-card alex-fade-in">
        <div class="alex-card-title">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113z" clip-rule="evenodd"/></svg>
          Video
        </div>
        <div class="alex-card-body" id="alex-video-title" style="font-weight:600; color:#312e81;"></div>
      </div>

      <!-- Summary -->
      <div class="alex-card alex-fade-in" id="alex-summary-card" style="display:none">
        <div class="alex-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          AI Summary
        </div>
        <div class="alex-card-body" id="alex-summary-body"></div>
      </div>

      <!-- Key Moments -->
      <div class="alex-card alex-fade-in" id="alex-timeline-card" style="display:none">
        <div class="alex-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Key Moments
        </div>
        <div id="alex-timestamp-list" class="alex-timestamp-list"></div>
      </div>

      <!-- Ask AI -->
      <div class="alex-card alex-fade-in" id="alex-chat-card" style="display:none">
        <div class="alex-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          Ask AI about this video
        </div>
        <div id="alexandria-chat-msgs"></div>
        <div id="alexandria-chat-input-row">
          <input id="alexandria-chat-input" type="text" placeholder="Ask anything…" />
          <button id="alexandria-chat-send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(sidebar);

  // Wire up events
  sidebar.querySelector('#alexandria-close-btn').addEventListener('click', () => toggleSidebar(false));
  sidebar.querySelector('#alexandria-analyze-btn').addEventListener('click', runAnalysis);
  sidebar.querySelector('#alexandria-chat-send').addEventListener('click', handleChat);
  sidebar.querySelector('#alexandria-chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) handleChat();
  });
}

// ─── Sidebar Toggle ───────────────────────────────────────────────────────────

function toggleSidebar(forceOpen) {
  if (!sidebar) buildSidebar();
  const shouldOpen = (forceOpen !== undefined) ? forceOpen : !isOpen;
  isOpen = shouldOpen;
  sidebar.classList.toggle('alexandria-open', isOpen);
  fab.style.display = isOpen ? 'none' : 'flex';
}

// ─── Analysis Flow ────────────────────────────────────────────────────────────

async function runAnalysis() {
  const ytId = getYouTubeId();
  if (!ytId) {
    alert('Please navigate to a YouTube video page first!');
    return;
  }

  const analyzeBtn = document.getElementById('alexandria-analyze-btn');
  const statusEl    = document.getElementById('alexandria-status');
  const statusText  = document.getElementById('alexandria-status-text');
  const progressCtr = document.getElementById('alexandria-progress-bar-container');
  const progressBar = document.getElementById('alexandria-progress-bar');
  const idleEl      = document.getElementById('alexandria-idle');
  const contentEl   = document.getElementById('alexandria-content');

  // Reset
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = '…';
  idleEl.style.display = 'none';
  contentEl.classList.remove('visible');
  statusEl.classList.add('visible');
  progressCtr.classList.add('visible');
  progressBar.style.width = '0%';
  chatHistory = [];

  const videoUrl = window.location.href;
  const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title')?.textContent?.trim()
    || document.title.replace(' - YouTube', '');

  try {
    statusText.textContent = 'Sending video to Alexandria…';
    progressBar.style.width = '5%';

    const ingestResult = await ingestUrl(videoUrl);

    let videoId = ingestResult.video_id;

    if (ingestResult.status === 'processing' && ingestResult.job_id) {
      const job = await pollJob(ingestResult.job_id, (pct, step) => {
        progressBar.style.width = `${pct}%`;
        statusText.textContent = step;
      });
      if (job.status === 'failed') throw new Error(job.message || 'Processing failed');
      videoId = job.video_id || videoId;
    }

    currentVideoId = videoId;
    progressBar.style.width = '95%';
    statusText.textContent = 'Fetching summary…';

    // Fetch summary and timeline in parallel
    const [summaryData, timelineData] = await Promise.all([
      getSummary(videoId),
      getTimeline(videoId)
    ]);

    progressBar.style.width = '100%';
    statusEl.classList.remove('visible');
    progressCtr.classList.remove('visible');

    // Render
    renderResults(videoTitle, summaryData, timelineData);

    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
      Re-analyze`;

  } catch (err) {
    console.error('[Alexandria]', err);
    statusEl.classList.remove('visible');
    progressCtr.classList.remove('visible');
    idleEl.style.display = 'flex';
    idleEl.querySelector('h3').textContent = 'Error';
    idleEl.querySelector('p').textContent = err.message || 'Something went wrong. Is the backend running?';
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Retry';
  }
}

// ─── Render Results ───────────────────────────────────────────────────────────

function renderResults(videoTitle, summaryData, timelineData) {
  const contentEl = document.getElementById('alexandria-content');
  contentEl.classList.add('visible');

  // Title
  document.getElementById('alex-video-title').textContent = videoTitle;

  // Summary
  const summaryCard = document.getElementById('alex-summary-card');
  const summaryBody = document.getElementById('alex-summary-body');
  if (summaryData?.summary) {
    summaryBody.textContent = summaryData.summary;
    summaryCard.style.display = 'block';
  }

  // Timeline / Key Moments
  const timelineCard = document.getElementById('alex-timeline-card');
  const timestampList = document.getElementById('alex-timestamp-list');
  const chapters = timelineData?.chapters || timelineData;
  if (Array.isArray(chapters) && chapters.length > 0) {
    timestampList.innerHTML = '';
    chapters.forEach(ch => {
      const item = document.createElement('div');
      item.className = 'alex-timestamp-item';
      item.innerHTML = `
        <span class="alex-ts-badge">${formatTime(ch.start_time ?? ch.timestamp ?? 0)}</span>
        <span class="alex-ts-text">${ch.title || ch.text || ''}</span>`;
      item.addEventListener('click', () => seekYouTube(ch.start_time ?? ch.timestamp ?? 0));
      timestampList.appendChild(item);
    });
    timelineCard.style.display = 'block';
  }

  // Chat
  document.getElementById('alex-chat-card').style.display = 'block';
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

async function handleChat() {
  if (!currentVideoId) return;
  const input = document.getElementById('alexandria-chat-input');
  const msgs  = document.getElementById('alexandria-chat-msgs');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('alexandria-chat-send').disabled = true;

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'alex-msg-user alex-fade-in';
  userMsg.textContent = message;
  msgs.appendChild(userMsg);
  msgs.scrollTop = msgs.scrollHeight;

  // Thinking indicator
  const thinking = document.createElement('div');
  thinking.className = 'alex-msg-ai alex-fade-in';
  thinking.innerHTML = '<span class="alex-spinner" style="display:inline-block;"></span>';
  msgs.appendChild(thinking);
  msgs.scrollTop = msgs.scrollHeight;

  try {
    const res = await sendChatMessage(currentVideoId, message);
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: res.answer || res.response || '' });

    thinking.className = 'alex-msg-ai alex-fade-in';
    thinking.textContent = res.answer || res.response || 'No response received.';
  } catch (err) {
    thinking.textContent = `Error: ${err.message}`;
  } finally {
    input.disabled = false;
    document.getElementById('alexandria-chat-send').disabled = false;
    input.focus();
    msgs.scrollTop = msgs.scrollHeight;
  }
}

// ─── Handle messages from background.js ──────────────────────────────────────

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'toggle') toggleSidebar();
});

// ─── Watch for URL changes (YouTube is SPA) ───────────────────────────────────

let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // If sidebar is open, reset idle state when navigating to a new video
    if (isOpen && sidebar) {
      const newYtId = getYouTubeId();
      if (newYtId && newYtId !== currentVideoId) {
        document.getElementById('alexandria-idle').style.display = 'flex';
        document.getElementById('alexandria-content').classList.remove('visible');
        document.getElementById('alexandria-analyze-btn').disabled = false;
        document.getElementById('alexandria-analyze-btn').innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg> Analyze`;
        currentVideoId = null;
      }
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// ─── Auto-build FAB on load ───────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { if (!fab) buildSidebar(); });
} else {
  buildSidebar();
}

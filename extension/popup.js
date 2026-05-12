// ============================================
// Alexandria v2.0 Extension - Popup Script
// ============================================

// Configuration
const API_BASE = localStorage.getItem('apiBase') || 'http://127.0.0.1:8001';
let authToken = localStorage.getItem('authToken');
let userId = localStorage.getItem('userId');
let username = localStorage.getItem('username');

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    
    if (authToken) {
        showMainSection();
        await loadCurrentPageInfo();
    } else {
        showAuthSection();
    }
});

// ============================================
// Event Listeners Setup
// ============================================

function setupEventListeners() {
    // Auth tabs
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', handleAuthTabSwitch);
    });

    // Feature tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleFeatureTabSwitch);
    });

    // Auth forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Main feature buttons
    document.getElementById('generateSummaryBtn')?.addEventListener('click', generateSummary);
    document.getElementById('askBtn')?.addEventListener('click', askQuestion);
    document.getElementById('exportBtn')?.addEventListener('click', exportSummary);
    document.getElementById('translateBtn')?.addEventListener('click', translateContent);
    document.getElementById('saveVideoBtn')?.addEventListener('click', saveVideo);
    document.getElementById('addStreamingBtn')?.addEventListener('click', addStreamingContent);
    document.getElementById('refreshLibraryBtn')?.addEventListener('click', loadLibrary);
    
    // Footer buttons
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
}

// ============================================
// Tab Switching
// ============================================

function handleAuthTabSwitch(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.auth-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Form`)?.classList.add('active');
}

function handleFeatureTabSwitch(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');
}

// ============================================
// Authentication
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    showLoading(true, 'loginBtnText');
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Login failed');
        }

        const data = await response.json();
        authToken = data.access_token;
        userId = data.user_id;
        username = data.username;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);

        showSuccess('Login successful! 🎉');
        setTimeout(() => {
            showMainSection();
            e.target.reset();
        }, 500);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false, 'loginBtnText');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username_val = e.target.querySelector('input[name="username"]').value;
    const email = e.target.querySelector('input[name="email"]').value;
    const password = e.target.querySelector('input[name="password"]').value;
    const fullName = e.target.querySelector('input[name="fullName"]').value;

    if (!username_val || !email || !password) {
        showError('Please fill in all required fields');
        return;
    }

    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }

    showLoading(true, 'signupBtnText');
    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username_val,
                email,
                password,
                full_name: fullName || null
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Signup failed');
        }

        const data = await response.json();
        authToken = data.access_token;
        userId = data.user_id;
        username = data.username;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);

        showSuccess('Account created! Welcome to Alexandria 🌿');
        setTimeout(() => {
            showMainSection();
            e.target.reset();
        }, 500);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false, 'signupBtnText');
    }
}

// ============================================
// Core Features
// ============================================

async function generateSummary(options = {}) {
    const videoId = await getYouTubeVideoId();
    if (!videoId) {
        showError('Not on a YouTube video or unable to detect video ID');
        return;
    }

        const output = document.getElementById('summaryOutput');
        const { silent = false } = options;
        if (output && !silent) {
            output.innerHTML = '<div class="analysis-empty">Generating a smart summary from the video ideas, not the raw subtitles...</div>';
            output.style.display = 'block';
        }

        showLoading(true);
    try {
            const response = await fetch(`${API_BASE}/analysis/${videoId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to generate summary');
        }

        const data = await response.json();
                renderAnalysis(data);
                showSuccess('AI summary loaded! ✨');
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

function renderAnalysis(data) {
        const output = document.getElementById('summaryOutput');
        const summaryText = data.summary || 'No AI summary is available yet.';
        const learningObjectives = Array.isArray(data.learning_objectives) ? data.learning_objectives : [];
        const keyConcepts = Array.isArray(data.key_concepts) ? data.key_concepts : [];
        const smartTimestamps = Array.isArray(data.timestamps) ? data.timestamps : [];
        const topics = Array.isArray(data.topics) ? data.topics : [];
            const score = Number(data.educational_score || 0);
            const mood = data.teaching_mode || 'mixed';

        output.innerHTML = `
                <div class="summary-hero">
                    <div class="summary-hero-copy">
                        <div class="summary-kicker">Smart video intelligence</div>
                        <h2>AI Summary</h2>
                        <p>Clean, learning-first insights generated from the video meaning, not copied subtitles.</p>
                    </div>
                    <div class="summary-score">
                        <div class="summary-score-value">${score}</div>
                        <div class="summary-score-label">Learning score</div>
                        <div class="summary-score-chip">${escapeHtml(mood)}</div>
                    </div>
                </div>

            <div class="analysis-header">
                <div>
                        <strong>Overview</strong>
                        <div class="analysis-meta">${escapeHtml(data.status || 'success')} • ${topics.length} topics • ${smartTimestamps.length} smart moments</div>
                </div>
                <div class="analysis-status">${escapeHtml(data.status || 'success')}</div>
            </div>

            <div class="analysis-block">
                <div class="analysis-label">Overview</div>
                <div class="analysis-text">${escapeHtml(summaryText)}</div>
            </div>

            ${learningObjectives.length ? `
                <div class="analysis-block">
                    <div class="analysis-label">What you will learn</div>
                    <ul class="analysis-list">
                        ${learningObjectives.map(item => `<li>${escapeHtml(String(item))}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${keyConcepts.length ? `
                <div class="analysis-block">
                    <div class="analysis-label">Key concepts</div>
                    <div class="analysis-pill-list">
                        ${keyConcepts.map(item => `<span class="analysis-pill">${escapeHtml(item.name || 'Concept')}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${topics.length ? `
                <div class="analysis-block">
                    <div class="analysis-label">Topic map</div>
                    <div class="analysis-cards">
                        ${topics.slice(0, 3).map(item => `
                            <div class="analysis-card">
                                <div class="analysis-card-title">${escapeHtml(item.topic || 'Topic')}</div>
                                <div class="analysis-card-text">${escapeHtml(item.summary || '')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${smartTimestamps.length ? `
                <div class="analysis-block">
                    <div class="analysis-label">Smart moments</div>
                    <div class="analysis-moments">
                        ${smartTimestamps.slice(0, 5).map(item => `
                            <button class="analysis-moment" type="button" data-time="${Number(item.time ?? item.timestamp ?? 0)}">
                                <span class="analysis-moment-time">${formatTime(item.time ?? item.timestamp ?? 0)}</span>
                                <span class="analysis-moment-label">${escapeHtml(item.label || 'Teaching moment')}</span>
                                <span class="analysis-moment-reason">${escapeHtml(item.reason || '')}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        output.style.display = 'block';

        output.querySelectorAll('[data-time]').forEach(button => {
            button.addEventListener('click', () => {
                const seconds = Number(button.dataset.time || 0);
                jumpToTimestamp(seconds);
            });
        });
}

function formatTime(seconds) {
        const total = Math.max(0, Math.floor(Number(seconds) || 0));
        const minutes = Math.floor(total / 60);
        const remaining = total % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function escapeHtml(value) {
        return String(value ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');
}

function jumpToTimestamp(seconds) {
        const url = new URL(window.location.href);
        url.searchParams.set('t', Math.max(0, Math.floor(Number(seconds) || 0)));
        window.open(url.toString(), '_blank', 'noopener');
}

async function askQuestion() {
    const question = document.getElementById('questionInput').value;
    const videoId = await getYouTubeVideoId();

    if (!question.trim()) {
        showError('Please enter a question');
        return;
    }

    if (!videoId) {
        showError('Not on a YouTube video');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                video_id: videoId,
                question: question.trim()
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to get answer');
        }

        const data = await response.json();
        const output = document.getElementById('qaOutput');
        output.innerHTML = `
            <strong>Q:</strong> ${question}<br><br>
            <strong>A:</strong> ${data.answer}
        `;
        output.style.display = 'block';
        document.getElementById('questionInput').value = '';
        showSuccess('Answer generated! ✅');
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function exportSummary() {
    const videoId = await getYouTubeVideoId();
    const exportType = document.getElementById('exportType').value;

    if (!videoId) {
        showError('Not on a YouTube video');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/features/export/summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                video_id: videoId,
                video_title: document.title,
                export_type: exportType
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Export failed');
        }

        const data = await response.json();
        const output = document.getElementById('exportOutput');
        
        if (data.url) {
            output.innerHTML = `
                <strong>✅ Export Ready!</strong><br><br>
                <a href="${data.url}" target="_blank" style="color: #10b981; text-decoration: underline;">
                    📌 Open ${data.type.toUpperCase()} →
                </a>
            `;
        } else if (data.content) {
            output.innerHTML = `<strong>Export:</strong><br>${data.content}`;
        }
        
        output.style.display = 'block';
        showSuccess(`Exported to ${exportType}! 🎉`);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function translateContent() {
    const language = document.getElementById('languageSelect').value;
    if (!language) {
        showError('Please select a language');
        return;
    }

    // Try to get summary from summary output
    const summaryOutput = document.getElementById('summaryOutput');
    let textToTranslate = summaryOutput?.textContent;

    if (!textToTranslate) {
        showError('Please generate a summary first');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/features/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                text: textToTranslate,
                target_language: language
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Translation failed');
        }

        const data = await response.json();
        const output = document.getElementById('translateOutput');
        output.innerHTML = `
            <strong>🌍 Translated to ${data.language_name}:</strong><br><br>
            ${data.translated}
        `;
        output.style.display = 'block';
        showSuccess(`Translated to ${data.language_name}! 🌎`);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function saveVideo() {
    const videoId = await getYouTubeVideoId();
    if (!videoId) {
        showError('Not on a YouTube video');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/auth/save-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                video_id: videoId,
                title: document.title,
                source: 'youtube',
                url: window.location.href
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Save failed');
        }

        showSuccess('Video saved to your library! 📚');
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function addStreamingContent() {
    const url = document.getElementById('streamingUrl').value;
    if (!url.trim()) {
        showError('Please paste a URL');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/features/ingest/auto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ url: url.trim() })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Failed to add content');
        }

        const data = await response.json();
        const output = document.getElementById('streamingOutput');
        output.innerHTML = `
            <strong>✅ Content Added!</strong><br><br>
            <strong>Type:</strong> ${data.source || 'auto-detected'}<br>
            <strong>Job ID:</strong> ${data.job_id}<br>
            <strong>Status:</strong> ${data.status}
        `;
        output.style.display = 'block';
        document.getElementById('streamingUrl').value = '';
        showSuccess('Streaming content added! 🎵');
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function loadLibrary() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/auth/saved-videos`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load library');
        }

        const data = await response.json();
        const libraryList = document.getElementById('libraryList');
        
        if (!data.videos || data.videos.length === 0) {
            libraryList.innerHTML = '<small>No saved videos yet. Save some to get started! 📚</small>';
        } else {
            libraryList.innerHTML = data.videos.map(video => `
                <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.1);">
                    <strong>${video.title}</strong><br>
                    <small style="color: #666;">${video.source} • ${new Date(video.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        }
        
        showSuccess('Library loaded! 📚');
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

// ============================================
// Utilities
// ============================================

function showMainSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainSection').style.display = 'block';
    
    const userDisplay = document.getElementById('userDisplay');
    const guestDisplay = document.getElementById('guestDisplay');
    const userName = document.getElementById('userName');
    
    if (username) {
        guestDisplay.style.display = 'none';
        userDisplay.style.display = 'block';
        userName.textContent = username;
    }
}

function showAuthSection() {
    document.getElementById('mainSection').style.display = 'none';
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('guestDisplay').style.display = 'block';
    document.getElementById('userDisplay').style.display = 'none';
}

function showLoading(show, btnId = null) {
    if (btnId) {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (!btn.dataset.originalText) {
                btn.dataset.originalText = btn.textContent;
            }
            if (show) {
                btn.innerHTML = '<span class="loading"></span><span>Working...</span>';
            } else {
                btn.textContent = btn.dataset.originalText || btn.textContent;
            }
        }
    }
}

function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message show ${type}`;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 4000);
}

function showSuccess(message) {
    showStatus(message, 'success');
}

function showError(message) {
    showStatus(message, 'error');
}

async function getYouTubeVideoId() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url;
        
        if (!url) return null;

        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    } catch (err) {
        console.error('Error getting video ID:', err);
        return null;
    }
}

async function loadCurrentPageInfo() {
    const videoId = await getYouTubeVideoId();
    const videoInfo = document.getElementById('videoInfo');
    const videoTitle = document.getElementById('videoTitle');
    
    if (videoId && videoInfo) {
        videoInfo.style.display = 'block';
        videoTitle.textContent = document.title;
        loadSummaryIfVideoPresent();
    }
}

function loadSummaryIfVideoPresent() {
    const hint = document.getElementById('summaryHint');
    if (hint) {
        hint.textContent = 'Analyzing the current video...';
    }
    generateSummary({ silent: true }).catch(() => {});
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    authToken = null;
    userId = null;
    username = null;
    
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    
    showAuthSection();
    showSuccess('Logged out successfully! 👋');
}

function openSettings() {
    const newApiBase = prompt(
        'Enter API Base URL (current: ' + API_BASE + '):\n\nExample: http://127.0.0.1:8001',
        API_BASE
    );
    
    if (newApiBase && newApiBase.trim()) {
        localStorage.setItem('apiBase', newApiBase.trim());
        showSuccess('Settings saved! Reloading...');
        setTimeout(() => location.reload(), 500);
    }
}

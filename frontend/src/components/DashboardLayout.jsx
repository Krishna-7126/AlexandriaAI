import { useState, useRef, Suspense, lazy } from 'react';
import {
  LayoutDashboard, FolderOpen, BarChart2, Zap, MessageSquare,
  Settings, Star, Send, ThumbsUp, ThumbsDown, BookOpen, Clock3,
  Sparkles, BrainCircuit
} from 'lucide-react';
import customLogo from '../assets/logo.png';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';
import IngestPanel from './IngestPanel';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/authContext';
import '../styles/dashboard.css';

const Timeline = lazy(() => import('./Timeline'));
const QuizPanel = lazy(() => import('./QuizPanel'));
const SummaryDashboard = lazy(() => import('./SummaryDashboard'));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));

// ── Nav items ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',     Icon: LayoutDashboard },
  { id: 'sources',   label: 'Sources',       Icon: FolderOpen      },
  { id: 'analytics', label: 'Analytics',     Icon: BarChart2       },
  { id: 'tools',     label: 'Smart Tools',   Icon: Zap             },
  { id: 'chat',      label: 'Conversations', Icon: MessageSquare   },
  { id: 'settings',  label: 'Settings',      Icon: Settings        },
];

// ── Feature panel items ───────────────────────────────────
const FEATURES = [
  {
    id: 'overview',
    label: 'Overview',
    desc: 'Get a summary of the source with key concepts, objectives, and main takeaways.',
    Icon: BrainCircuit,
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'chat',
    label: 'Q&A Chat',
    desc: 'Ask questions, get explanations, and explore ideas.',
    Icon: MessageSquare,
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    id: 'chapters',
    label: 'Smart Moments',
    desc: 'Browse key video timestamps and important highlights.',
    Icon: Clock3,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    id: 'quiz',
    label: 'Smart Quiz',
    desc: 'Test your knowledge with custom quizzes.',
    Icon: Sparkles,
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    desc: 'Explore patterns, word usage, and insights.',
    Icon: BarChart2,
    color: '#0EA5E9',
    bg: '#F0F9FF',
  },
];

// ── Quick prompts shown inside AI sidebar ────────────────
const QUICK_PROMPTS = [
  'What is the main idea?',
  'Explain this in simpler terms.',
  'What are the key takeaways?',
  'Give me the most important points.',
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const [activeNav, setActiveNav]         = useState('dashboard');
  const [activeFeature, setActiveFeature] = useState('overview');

  const [videoId, setVideoId]     = useState(import.meta.env.DEV ? 'dev-demo' : null);
  const [youtubeId, setYoutubeId] = useState(import.meta.env.DEV ? 'dQw4w9WgXcQ' : null);
  const [ingestInfo, setIngestInfo] = useState(
    import.meta.env.DEV
      ? {
          preview_title:   'Demo Lecture: Intro to AI',
          source:          'Dev Demo',
          chunk_count:     12,
          transcript_length: 482,
          preview_summary: 'This is a short demo summary to show the workspace layout in development mode.',
        }
      : null
  );

  const [chatQuestion, setChatQuestion] = useState('');
  const [sidebarChatHistory, setSidebarChatHistory] = useState([
    {
      id: 'init-ai',
      role: 'ai',
      content: "Hello! I can help you understand this video better. Ask me anything or try one of the suggestions below.",
      chips: QUICK_PROMPTS,
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);
  const playerRef  = useRef(null);

  const isProcessing = ingestInfo?.status === 'processing';

  const handleIngestSuccess = (id, ytId, info) => {
    setVideoId(id);
    setYoutubeId(ytId);
    setIngestInfo(info || null);
  };

  const handleTimestampClick = (seconds) => {
    playerRef.current?.seekTo(seconds);
  };

  // Quick-send a prompt from chips
  const handleChipSend = (prompt) => {
    setChatQuestion(prompt);
    sendSidebarMessage(prompt);
  };

  const sendSidebarMessage = (text) => {
    const q = (text || chatQuestion).trim();
    if (!q) return;
    setChatQuestion('');
    setSidebarChatHistory(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: q },
      {
        id: `a-${Date.now() + 1}`,
        role: 'ai',
        content: videoId
          ? "I couldn't find a transcript data for that video yet. Please try again a video first."
          : "Please analyze a video first so I can answer questions about it.",
      },
    ]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  const handleSidebarSubmit = (e) => {
    e.preventDefault();
    sendSidebarMessage(chatQuestion);
  };

  const pageTitle   = ingestInfo?.preview_title || ingestInfo?.source || 'No video loaded';
  const chapterCount = ingestInfo?.chunk_count   ?? 0;
  const wordCount    = ingestInfo?.transcript_length ?? 0;
  const analyticsUserId = user?.user_id || 'dev-demo-user';

  return (
    <>
      {/* ── TOP NAVBAR ──────────────────────────────────── */}
      <nav className="db-topnav">
        <div className="db-topnav__logo">
          <div className="db-topnav__logo-icon">
            {customLogo
              ? <img src={customLogo} alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              : <Star size={16} />
            }
          </div>
          <span className="db-topnav__logo-text">AI Learning Studio</span>
        </div>

        <div className="db-topnav__actions">
          <button
            className="db-btn-outline"
            onClick={() => { setVideoId(null); setIngestInfo(null); setActiveNav('dashboard'); }}
          >
            Analyze Another Video
          </button>
          <div className="db-avatar">H</div>
        </div>
      </nav>

      {/* ── DASHBOARD SHELL ──────────────────────────── */}
      <div className="dashboard-shell">

        {/* ── LEFT SIDEBAR ──────────────────────────── */}
        <aside className="db-sidebar">
          <nav className="db-sidebar__nav">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`db-nav-item ${activeNav === id ? 'active' : ''}`}
                onClick={() => setActiveNav(id)}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          {/* Upgrade card */}
          <div className="db-upgrade-card">
            <div className="db-upgrade-card__icon">
              <Star size={20} />
            </div>
            <div className="db-upgrade-card__title">Unlock Premium</div>
            <div className="db-upgrade-card__desc">
              Get advanced analytics, longer transcripts, and more.
            </div>
            <button className="db-upgrade-btn">Upgrade Now</button>
          </div>
        </aside>

        {/* ── MAIN AREA ──────────────────────────────── */}
        <main className="db-main">

          {/* Left content column */}
          <div className="db-content-col">

            {/* Header */}
            <div className="db-content-header db-fade-in">
              <div className="db-content-header__left">
                <div className="db-eyebrow">Analyzing Source</div>
                <div className="db-page-title">{pageTitle}</div>
                {videoId && (
                  <div className="db-stats-row">
                    <div className="db-stat">
                      <span className="db-stat__label">Chapters</span>
                      <span className="db-stat__value">{chapterCount}</span>
                    </div>
                    <div className="db-stat">
                      <span className="db-stat__label">Words</span>
                      <span className="db-stat__value">{wordCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video area */}
            {!videoId ? (
              <div className="db-fade-in" style={{ maxWidth: 600 }}>
                <IngestPanel onIngestSuccess={handleIngestSuccess} />
              </div>
            ) : (
              <>
                <div className="db-video-card db-fade-in">
                  <VideoPlayer videoId={youtubeId} ref={playerRef} />
                </div>

                <div className="db-source-card db-fade-in">
                  <div className="db-source-card__eyebrow">Current Source</div>
                  <div className="db-source-card__title">{pageTitle}</div>
                  <div className="db-source-card__desc">
                    Use the features sidebar to switch between the overview, chat, smart moments, quiz, and analytics.
                  </div>
                </div>

                {/* Active feature panel body */}
                <div className="db-fade-in">
                  <Suspense fallback={<LoadingSpinner />}>
                    {activeFeature === 'overview'  && <SummaryDashboard videoId={videoId} isProcessing={isProcessing} previewTitle={ingestInfo?.preview_title} previewSummary={ingestInfo?.preview_summary} onTimestampClick={handleTimestampClick} />}
                    {activeFeature === 'chat'      && <ChatPanel key={videoId} videoId={videoId} isProcessing={isProcessing} onTimestampClick={handleTimestampClick} />}
                    {activeFeature === 'chapters'  && <Timeline videoId={videoId} isProcessing={isProcessing} onTimestampClick={handleTimestampClick} />}
                    {activeFeature === 'quiz'      && <QuizPanel key={videoId} videoId={videoId} isProcessing={isProcessing} />}
                    {activeFeature === 'analytics' && <AnalyticsPanel userId={analyticsUserId} />}
                  </Suspense>
                </div>
              </>
            )}
          </div>

          {/* Right features column */}
          <div className="db-features-col">
            <div className="db-features-header">
              <div className="db-features-header__eyebrow">Features Menu</div>
              <div className="db-features-header__title">Switch sections</div>
              <div className="db-features-header__desc">
                Use the sidebar to move between the overview, chat, smart moments, quiz, and analytics.
              </div>
            </div>

            <div className="db-feature-list">
              {FEATURES.map(({ id, label, desc, Icon, color, bg }) => (
                <button
                  key={id}
                  className={`db-feature-item ${activeFeature === id ? 'active' : ''}`}
                  onClick={() => setActiveFeature(id)}
                >
                  <div className="db-feature-icon" style={{ background: bg, color }}>
                    <Icon size={16} />
                  </div>
                  <div className="db-feature-copy">
                    <span className="db-feature-copy__title">{label}</span>
                    <span className="db-feature-copy__desc">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* ── RIGHT AI SIDEBAR ──────────────────────── */}
        <aside className="db-ai-sidebar">
          <div className="db-ai-sidebar__header">
            <div className="db-ai-sidebar__eyebrow">Q&A Chat</div>
            <div className="db-ai-sidebar__title">Ask smarter questions</div>
            <div className="db-ai-sidebar__desc">
              Use AI to dive deeper into the video. Ask anything related to the topic and get instant answers.
            </div>

            {/* Suggestion chips */}
            <div className="db-chips">
              {['Follow-up questions', 'Timestamps', 'Key concepts', 'Streaming answers'].map(c => (
                <button key={c} className="db-chip" onClick={() => handleChipSend(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div className="db-chat-messages">
            {sidebarChatHistory.map((msg) => {
              if (msg.role === 'ai') {
                return (
                  <div key={msg.id} className="db-chat-ai-msg db-fade-in">
                    <div className="db-chat-ai-msg__header">
                      <div className="db-chat-ai-icon">
                        <BrainCircuit size={11} />
                      </div>
                      AI Assistant
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{msg.content}</div>

                    {/* Inner chips on first message */}
                    {msg.chips && (
                      <div className="db-inner-chips">
                        {msg.chips.map(c => (
                          <button key={c} className="db-inner-chip" onClick={() => handleChipSend(c)}>{c}</button>
                        ))}
                      </div>
                    )}

                    {/* Feedback */}
                    {!msg.chips && (
                      <div className="db-feedback-row">
                        <button className="db-feedback-btn">👍</button>
                        <button className="db-feedback-btn">👎</button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={msg.id} className="db-chat-user-msg db-fade-in">
                  {msg.content}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="db-chat-input-bar">
            <form onSubmit={handleSidebarSubmit}>
              <div className="db-chat-input-row">
                <input
                  className="db-chat-input"
                  type="text"
                  value={chatQuestion}
                  onChange={e => setChatQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className="db-chat-send-btn"
                  disabled={!chatQuestion.trim() || isSending}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
            <div className="db-chat-disclaimer">AI can make mistakes. Verify important info.</div>
          </div>
        </aside>

      </div>
    </>
  );
}

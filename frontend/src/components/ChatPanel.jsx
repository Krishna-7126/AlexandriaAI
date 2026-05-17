import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Clock } from 'lucide-react';
import { askQuestionStream } from '../api/client';

export default function ChatPanel({ videoId, onTimestampClick, isProcessing = false }) {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const answerCacheRef = useRef(new Map());
  const pendingQuestionRef = useRef('');
  const quickPrompts = [
    'What is the main idea?',
    'Explain this like I am new to the topic.',
    'What changed around the key timestamp?',
    'Give me the most important takeaways.',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const normalizeQuestion = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const appendCachedExchange = (currentQuestion, cached) => {
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();
    setChatHistory(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: currentQuestion },
      { id: aiMsgId, role: 'ai', content: cached.answer, timestamps: cached.timestamps || [] },
    ]);
    if ((cached.timestamps || []).length > 0 && onTimestampClick) {
      onTimestampClick(cached.timestamps[0]);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || !videoId) return;
    if (isAsking) return;

    const currentQuestion = question;
    const questionKey = normalizeQuestion(currentQuestion);
    const cached = answerCacheRef.current.get(questionKey);
    if (cached?.answer) {
      setQuestion('');
      appendCachedExchange(currentQuestion, cached);
      return;
    }

    if (pendingQuestionRef.current === questionKey) {
      return;
    }

    setQuestion('');
    pendingQuestionRef.current = questionKey;

    const userMsgId = Date.now().toString();
    setChatHistory(prev => [...prev, { id: userMsgId, role: 'user', content: currentQuestion }]);

    setIsAsking(true);

    const aiMsgId = (Date.now() + 1).toString();
    setChatHistory(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', timestamps: [] }]);

    let accumulatedContent = '';

    await askQuestionStream(
      videoId,
      currentQuestion,
      sessionId,
      (chunk) => {
        accumulatedContent += chunk;
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, content: accumulatedContent } : msg
          )
        );
      },
      (timestamps) => {
        answerCacheRef.current.set(questionKey, {
          answer: accumulatedContent,
          timestamps: [...timestamps],
        });
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, timestamps: [...(msg.timestamps || []), ...timestamps] } : msg
          )
        );
        if (timestamps.length > 0 && onTimestampClick) {
          onTimestampClick(timestamps[0]);
        }
      },
      () => {
        setIsAsking(false);
        pendingQuestionRef.current = '';
        if (accumulatedContent) {
          answerCacheRef.current.set(questionKey, {
            answer: accumulatedContent,
            timestamps: [],
          });
        }
      },
      (error) => {
        setIsAsking(false);
        pendingQuestionRef.current = '';
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, content: `${accumulatedContent}\n\n**Error:** ${error.message}` } : msg
          )
        );
      }
    );
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizeTimestamp = (ts) => {
    if (typeof ts === 'number') return ts;
    if (typeof ts === 'string') return Number(ts) || 0;
    if (ts && typeof ts === 'object') return Number(ts.time ?? ts.timestamp ?? 0) || 0;
    return 0;
  };

  const splitAnswer = (content) => {
    const lines = String(content || '').split('\n');
    const noteLines = [];
    const bodyLines = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('note:') || trimmed.toLowerCase().startsWith('transcript warnings:')) {
        noteLines.push(trimmed);
      } else if (trimmed) {
        bodyLines.push(line);
      }
    }
    return { note: noteLines.join(' • '), body: bodyLines.join('\n').trim() };
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            <MessageSquare size={14} /> Conversational help
          </div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '0.35rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
            <MessageSquare color="var(--primary)" /> Q&A Chat
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '62ch' }}>
            Ask for clarification, ask for examples, or jump directly to the moment that answers your question.
          </p>
        </div>

        <div style={{ padding: '0.55rem 0.85rem', borderRadius: '999px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontSize: '0.82rem', fontWeight: 700 }}>
          {chatHistory.length} messages
        </div>
      </div>

      <div className="chat-quick-prompts">
        {quickPrompts.map((prompt) => (
          <button key={prompt} type="button" className="ghost" onClick={() => setQuestion(prompt)} style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', fontSize: '0.82rem' }}>
            {prompt}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.95rem', minHeight: 0 }}>
        {chatHistory.length === 0 ? (
          <div className="chat-empty-state">
            <p style={{ marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>Ask a question about the video.</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>Try “What is the main topic?” or “Explain the concept at 2:00”.</p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isAi = msg.role === 'ai';
            const parsed = isAi ? splitAnswer(msg.content) : { note: '', body: msg.content };
            const isStreaming = isAi && isAsking && !msg.content;

            return (
              <div key={msg.id} className="fade-in" style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-container-lowest)',
                color: msg.role === 'user' ? 'var(--on-primary)' : 'var(--on-surface)',
                padding: '1.05rem 1.1rem',
                borderRadius: '1.35rem',
                borderBottomRightRadius: msg.role === 'user' ? '0.2rem' : '1.35rem',
                borderBottomLeftRadius: msg.role === 'ai' ? '0.2rem' : '1.35rem',
                maxWidth: '88%',
                lineHeight: 1.65,
                boxShadow: '0 10px 20px -10px rgba(0,0,0,0.08)',
                border: msg.role === 'ai' ? '1px solid var(--outline-variant)' : 'none'
              }}>
                {isStreaming && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '280px' }}>
                    <div className="skeleton skeleton-line" style={{ width: '72%', height: '12px' }} />
                    <div className="skeleton skeleton-line" style={{ width: '92%', height: '12px' }} />
                    <div className="skeleton skeleton-line" style={{ width: '64%', height: '12px' }} />
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      Thinking...
                    </div>
                  </div>
                )}
                {parsed.note && (
                  <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontSize: '0.85rem' }}>
                    {parsed.note}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{parsed.body || msg.content}</div>

                {isAi && msg.timestamps && msg.timestamps.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.timestamps.map((ts, idx) => (
                      <button
                        key={idx}
                        onClick={() => onTimestampClick && onTimestampClick(normalizeTimestamp(ts))}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: 'var(--primary-fixed)',
                          border: '1px solid var(--primary-fixed-dim)',
                          color: 'var(--on-primary-fixed-variant)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          boxShadow: 'none'
                        }}>
                        <Clock size={12} /> {formatTime(normalizeTimestamp(ts))}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleAsk} className="chat-composer">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={isProcessing ? 'Ask now; answers improve as analysis finishes...' : 'Ask a question...'}
          disabled={!videoId || isAsking}
        />
        <button
          type="submit"
          disabled={!videoId || isAsking || !question.trim()}
          style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
}

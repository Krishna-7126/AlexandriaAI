import { useEffect, useRef, useState } from 'react';
import { AlignLeft, List, History, Loader2, PlayCircle, Star, Sparkles, Target, BrainCircuit } from 'lucide-react';
import { getAnalysis } from '../api/client';

export default function SummaryDashboard({ videoId, onTimestampClick, isProcessing = false, previewTitle = '', previewSummary = '' }) {
  const [overall, setOverall] = useState(null);
  const [topics, setTopics] = useState(null);
  const [recent, setRecent] = useState(null);
  const [quality, setQuality] = useState(null);
  const [educationalScore, setEducationalScore] = useState(0);
  const [teachingMode, setTeachingMode] = useState('mixed');
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  const buildSmartInsight = (data = {}) => {
    const objectives = Array.isArray(data.learning_objectives) ? data.learning_objectives.filter(Boolean) : [];
    const concepts = Array.isArray(data.key_concepts) ? data.key_concepts.filter(Boolean) : [];
    const topicNames = Array.isArray(data.topics)
      ? data.topics.map((topic) => topic?.topic).filter(Boolean).slice(0, 3)
      : [];
    const focus = objectives[0] || concepts[0]?.name || topicNames[0] || 'the core ideas';
    const secondFocus = topicNames[1] || concepts[1]?.name || objectives[1] || '';
    const mode = data.teaching_mode || 'mixed';

    return `This looks like a ${mode} learning session centered on ${focus}. ${secondFocus ? `A second thread worth following is ${secondFocus}. ` : ''}The strongest takeaways are being organized into a cleaner AI summary, smart moments, and concept cards.`;
  };

  useEffect(() => {
    if (!videoId) return;

    const requestId = ++requestSeq.current;
    let stopped = false;

    const fetchAnalysis = async () => {
      setOverall(null);
      setTopics(null);
      setRecent(null);
      setQuality(null);
      setEducationalScore(0);
      setTeachingMode('mixed');
      setLearningObjectives([]);
      setKeyConcepts([]);
      setError('');
      setLoading(true);
      try {
        const data = await getAnalysis(videoId);
        if (stopped || requestSeq.current !== requestId) return 'stale';
        
        const summaryReady = data.summary && !data.summary.startsWith('Summary is not available yet');
        if (summaryReady) {
          setOverall(data.summary);
        }
        if (Array.isArray(data.topics)) setTopics(data.topics);
        if (data.recent_summary && data.recent_summary !== 'No content available') setRecent(data.recent_summary);
        if (data.quality) setQuality(data.quality);
        if (Array.isArray(data.learning_objectives)) setLearningObjectives(data.learning_objectives);
        if (Array.isArray(data.key_concepts)) setKeyConcepts(data.key_concepts);
        if (typeof data.educational_score === 'number') setEducationalScore(data.educational_score);
        if (data.teaching_mode) setTeachingMode(data.teaching_mode);
        setLoading(data.status !== 'success');
        return data.status;
      } catch (err) {
        if (stopped || requestSeq.current !== requestId) return 'stale';
        if (!previewSummary) {
          setError(err.message || 'Failed to fetch summaries');
        }
        console.error("Failed to fetch summaries", err);
        setLoading(false);
        return 'error';
      }
    };

    fetchAnalysis();
    const interval = isProcessing
      ? window.setInterval(() => {
          void fetchAnalysis();
        }, 1500)
      : null;

    return () => {
      stopped = true;
      if (interval) window.clearInterval(interval);
      requestSeq.current += 1;
    };
  }, [videoId, isProcessing, previewSummary]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (item) => {
    const raw = typeof item === 'number' ? item : (item?.time ?? item?.timestamp ?? 0);
    return formatTime(Number(raw) || 0);
  };

  const jumpToTimestamp = (item) => {
    const raw = typeof item === 'number' ? item : (item?.time ?? item?.timestamp ?? 0);
    if (onTimestampClick) onTimestampClick(Number(raw) || 0);
  };

  const smartInsight = overall || buildSmartInsight({
    learning_objectives: learningObjectives,
    key_concepts: keyConcepts,
    topics,
    teaching_mode: teachingMode,
  });

  const visibleTopics = Array.isArray(topics) ? topics : [];
  const objectiveCards = learningObjectives.length > 0
    ? learningObjectives.slice(0, 3)
    : ['Waiting for intelligent objectives...', 'The AI will surface the strongest learning goals here.', 'Use the summary once analysis finishes.'];
  const conceptCards = (keyConcepts.length > 0
    ? keyConcepts.slice(0, 3)
    : visibleTopics.slice(0, 3).map((topic) => ({ name: topic.topic, timestamp: topic.timestamp }))).filter(Boolean);


  const hasVisibleContent = Boolean(overall || (topics && topics.length > 0) || recent || previewSummary);

  if (loading && !hasVisibleContent) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div className="skeleton skeleton-line" style={{ width: '38%', height: '18px' }} />
          <Loader2 className="animate-spin" size={20} color="var(--primary)" />
        </div>
        <div className="skeleton-card" style={{ padding: '1rem' }}>
          <div className="skeleton skeleton-line" style={{ width: '24%', marginBottom: '0.75rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '92%', marginBottom: '0.6rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '86%', marginBottom: '0.6rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        </div>
        <div className="skeleton-card" style={{ padding: '1rem' }}>
          <div className="skeleton skeleton-line" style={{ width: '30%', marginBottom: '0.9rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '88%', marginBottom: '0.6rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '78%', marginBottom: '0.6rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '64%' }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginTop: 'auto', textAlign: 'center' }}>
          Building summaries in the background...
        </p>
      </div>
    );
  }

  if (error && !hasVisibleContent) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <AlignLeft size={32} color="var(--danger)" />
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
        <AlignLeft size={32} color="var(--outline)" />
        <p style={{ color: 'var(--text-secondary)' }}>Summary will appear after ingest</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <section className="fade-in glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }}>
              <Sparkles size={14} /> Overview
            </div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--primary)', fontFamily: 'Literata, serif' }}>Learning snapshot</h3>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '62ch' }}>
              A structured summary that keeps the same visual language as the rest of the app while making each analysis section easier to scan.
            </p>
          </div>
          <div style={{ padding: '0.55rem 0.85rem', borderRadius: '999px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', color: 'var(--on-surface-variant)', fontSize: '0.82rem', fontWeight: 700 }}>
            {teachingMode ? `Teaching mode: ${teachingMode}` : 'Analyzing teaching style...'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ padding: '1.25rem', borderRadius: '1.15rem', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem' }}>
              <Sparkles size={14} /> Educational Intelligence
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{educationalScore || 0}<span style={{ fontSize: '1rem', marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>/100</span></div>
            <p style={{ margin: '0.6rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{teachingMode ? `Teaching mode detected: ${teachingMode}` : 'Analyzing teaching style...'}</p>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem 1rem 1.05rem', borderRadius: '1.15rem', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem' }}>
                  <Target size={14} /> Learning Objectives
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {objectiveCards.map((item, index) => (
                    <div key={index} style={{ padding: '0.7rem 0.8rem', borderRadius: '0.95rem', background: 'var(--surface-container)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.45 }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1rem 1rem 1.05rem', borderRadius: '1.15rem', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem' }}>
                  <BrainCircuit size={14} /> Key Concepts
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {conceptCards.map((item, index) => (
                    <button key={index} type="button" onClick={() => jumpToTimestamp(item)} style={{ textAlign: 'left', background: 'var(--surface-container-low)', color: 'var(--text-primary)', border: '1px solid var(--outline-variant)', padding: '0.75rem 0.85rem', borderRadius: '0.95rem', boxShadow: 'none' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>{item.name || item.topic || 'Concept'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTimestamp(item)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {isProcessing && (previewTitle || previewSummary) && (
              <section className="fade-in" style={{ padding: '1rem 1.1rem', borderRadius: '1.15rem', background: 'linear-gradient(135deg, rgba(180,205,184,0.22), rgba(255,255,255,0.65))', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Instant Preview
                </div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '0.35rem' }}>{previewTitle || 'Processing video'}</div>
                <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7 }}>{previewSummary || 'The AI is still building the final summary and smart moments in the background.'}</p>
              </section>
            )}
          </div>
        </div>
      </section>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Loader2 className="animate-spin" size={16} />
          Refreshing final transcript analysis...
        </div>
      )}

      {quality && (
        <section className="fade-in glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Quality</h3>
            <span style={{
              padding: '0.2rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'var(--primary)',
              color: '#fff',
              whiteSpace: 'nowrap'
            }}>
              {quality.score || 'A+'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
             {quality.warnings?.map((w, i) => (
               <span key={i} style={{ fontSize: '0.75rem', color: 'var(--on-primary-fixed-variant)', background: 'var(--primary-fixed)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                 {w}
               </span>
             ))}
          </div>
        </section>
      )}
      
      {/* Overall Summary */}
      <section className="fade-in glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'Literata, serif', marginBottom: '1rem' }}>
          <Star size={20} fill="var(--primary)" /> Overall Insight
        </h3>
        <p style={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
          {smartInsight}
        </p>
      </section>

      {/* Grid for Topics and Recent Context */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.5rem' }}>
        {/* Topic Summaries */}
        <section className="fade-in glass-panel" style={{ animationDelay: '0.1s', padding: '1.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'Literata, serif', marginBottom: '1rem' }}>
            <List size={20} /> Key Concepts
          </h3>
          {topics && topics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {topics.map((t, i) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'var(--surface-container-lowest)', 
                    border: '1px solid var(--outline-variant)',
                    padding: '1.1rem 1.15rem', 
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}
                  onClick={() => onTimestampClick && onTimestampClick(t.timestamp)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderColor = 'var(--outline-variant)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>{t.topic}</h4>
                    <span style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.25rem', 
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
                      background: 'var(--primary-fixed)',
                      padding: '0.2rem 0.6rem', borderRadius: '999px'
                    }}>
                      <PlayCircle size={12} /> {formatTime(t.timestamp)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.summary}</p>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Topic summaries will be generated as analysis progresses.</p>}
        </section>

        {/* Last N Minutes */}
        <section className="fade-in glass-panel" style={{ animationDelay: '0.2s', padding: '1.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'Literata, serif', marginBottom: '1rem' }}>
            <History size={20} /> Recent Context
          </h3>
          <div style={{ color: 'var(--text-primary)', lineHeight: 1.7, padding: '1rem 1.05rem', background: 'var(--surface-container-lowest)', borderRadius: '1rem', border: '1px solid var(--outline-variant)' }}>
            {recent || 'Recent AI context will appear once analysis finishes.'}
          </div>
        </section>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { AlignLeft, List, History, Loader2, PlayCircle } from 'lucide-react';
import { getOverallSummary, getTopicSummaries, getLastMinutesSummary, getQuality } from '../api/client';

export default function SummaryDashboard({ videoId, onTimestampClick }) {
  const [overall, setOverall] = useState(null);
  const [topics, setTopics] = useState(null);
  const [recent, setRecent] = useState(null);
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!videoId) return;

    const requestId = ++requestSeq.current;
    setOverall(null);
    setTopics(null);
    setRecent(null);
    setQuality(null);
    setError('');

    const fetchSummaries = async () => {
      setLoading(true);
      try {
        const [overallData, topicsData, recentData] = await Promise.all([
          getOverallSummary(videoId).catch(() => null),
          getTopicSummaries(videoId).catch(() => null),
          getLastMinutesSummary(videoId, 5).catch(() => null)
        ]);

        const qualityData = await getQuality(videoId).catch(() => null);

        if (requestSeq.current !== requestId) return;
        
        if (overallData) setOverall(overallData.summary);
        if (topicsData) setTopics(topicsData.topics);
        if (recentData) setRecent(recentData.summary);
        if (qualityData) setQuality(qualityData.quality);
        if (!overallData && !topicsData && !recentData) {
          setError('No summary data returned for this video yet.');
        }
      } catch (err) {
        if (requestSeq.current !== requestId) return;
        setError(err.message || 'Failed to fetch summaries');
        console.error("Failed to fetch summaries", err);
      } finally {
        if (requestSeq.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchSummaries();
    return () => {
      requestSeq.current += 1;
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Summaries will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} color="var(--accent-color)" />
        <p style={{ color: 'var(--text-secondary)' }}>Generating comprehensive summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <AlignLeft size={32} color="var(--accent-color)" />
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const qualityPercent = quality ? Math.round((quality.score === 'high' ? 92 : quality.score === 'medium' ? 65 : 28)) : 0;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>

      {quality && (
        <section className="fade-in" style={{ border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-hover)' }}>Transcript Quality</h3>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              background: quality.score === 'high' ? 'rgba(16, 185, 129, 0.15)' : quality.score === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: quality.score === 'high' ? '#34d399' : quality.score === 'medium' ? '#fbbf24' : '#f87171'
            }}>
              {quality.score || 'unknown'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Source: {quality.source || 'unknown'}</span>
            <span>Method: {quality.method || 'unknown'}</span>
            <span>Words: {quality.word_count ?? 0}</span>
            <span>Chunks: {quality.chunk_count ?? 0}</span>
            <span>Uniq: {Math.round((quality.unique_ratio || 0) * 100)}%</span>
          </div>
          <div style={{ marginTop: '0.8rem', height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${qualityPercent}%`, height: '100%', borderRadius: '999px', background: quality.score === 'high' ? 'linear-gradient(90deg, #10b981, #34d399)' : quality.score === 'medium' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)', transition: 'width 0.3s ease' }} />
          </div>
          {quality.warnings && quality.warnings.length > 0 && (
            <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {quality.warnings.map((warning) => (
                <div key={warning}>• {warning}</div>
              ))}
            </div>
          )}
        </section>
      )}
      
      {/* Overall Summary */}
      <section className="fade-in">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--accent-hover)' }}>
          <AlignLeft size={18} /> Overall Summary
        </h3>
        <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
          {overall || "No overall summary available yet."}
        </p>
      </section>

      {/* Topic Summaries */}
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--accent-hover)' }}>
          <List size={18} /> Key Topics
        </h3>
        {topics && topics.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topics.map((t, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)',
                  padding: '1rem', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={() => onTimestampClick && onTimestampClick(t.timestamp)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{t.topic}</h4>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.25rem', 
                    fontSize: '0.8rem', color: 'var(--accent-color)', background: 'rgba(139,92,246,0.1)',
                    padding: '0.2rem 0.5rem', borderRadius: '12px'
                  }}>
                    <PlayCircle size={12} /> {formatTime(t.timestamp)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No topics detected yet.</p>
        )}
      </section>

      {/* Last N Minutes */}
      <section className="fade-in" style={{ animationDelay: '0.2s' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--accent-hover)' }}>
          <History size={18} /> Last 5 Minutes
        </h3>
        <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
          {recent || "No recent summary available yet."}
        </p>
      </section>

    </div>
  );
}

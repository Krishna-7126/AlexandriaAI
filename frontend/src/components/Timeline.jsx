import { useEffect, useRef, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { getAnalysis } from '../api/client';

export default function Timeline({ videoId, onTimestampClick, isProcessing = false }) {
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  const isMeaningfulLabel = (value) => {
    const label = String(value || '').trim();
    if (!label) return false;
    if (/^(chunk\s+\d+|start|teaching moment)$/i.test(label)) return false;
    return true;
  };

  useEffect(() => {
    if (!videoId) return;

    const requestId = ++requestSeq.current;
    let stopped = false;

    const fetchTimeline = async () => {
      setTimestamps([]);
      setLoading(true);
      try {
        const data = await getAnalysis(videoId);
        if (stopped || requestSeq.current !== requestId) return;
        if (data && data.timestamps) {
          setTimestamps(data.timestamps);
        }
      } catch (err) {
        if (stopped || requestSeq.current !== requestId) return;
        console.error("Failed to fetch timeline", err);
      } finally {
        if (!stopped && requestSeq.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();
    const interval = isProcessing
      ? window.setInterval(() => {
          void fetchTimeline();
        }, 1500)
      : null;

    return () => {
      stopped = true;
      if (interval) window.clearInterval(interval);
      requestSeq.current += 1;
    };
  }, [videoId, isProcessing]);

  if (!videoId) {
    return null; // Don't show timeline if no video or no timestamps
  }

  const visibleTimestamps = timestamps
    .filter((ts) => isMeaningfulLabel(ts?.label) || isMeaningfulLabel(ts?.reason))
    .map((ts, index) => ({ ...ts, displayLabel: isMeaningfulLabel(ts?.label) ? ts.label : `Smart moment ${index + 1}` }));

  if (isProcessing && visibleTimestamps.length === 0) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
          <Clock size={18} color="var(--primary)" /> Smart Moments
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span>Building smart moments as the AI finishes analysis...</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '48%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '86%' }} />
          </div>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '42%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '78%' }} />
          </div>
          <div className="skeleton-card" style={{ padding: '0.85rem', minHeight: '72px' }}>
            <div className="skeleton skeleton-line" style={{ width: '52%', marginBottom: '0.6rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '68%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (visibleTimestamps.length === 0) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.25rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
          <Clock size={18} color="var(--primary)" /> Smart Moments
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          The AI has not produced moment markers yet. They will appear here once analysis finishes.
        </p>
      </div>
    );
  }

  const formatTime = (seconds) => {
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

  return (
    <div className="glass-panel">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'Literata, serif', color: 'var(--primary)' }}>
        <Clock size={18} color="var(--primary)" /> Smart Moments
      </h3>
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading smart moments...</p>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {visibleTimestamps.map((ts, idx) => (
            <button
              key={idx}
              onClick={() => onTimestampClick && onTimestampClick(normalizeTimestamp(ts))}
              style={{
                flexShrink: 0,
                background: 'var(--surface-container)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.5rem 1rem',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--on-primary-fixed-variant)', marginBottom: '0.25rem', fontWeight: 600 }}>
                {formatTime(normalizeTimestamp(ts))}
              </span>
              <span style={{ fontSize: '0.9rem', textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ts.displayLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

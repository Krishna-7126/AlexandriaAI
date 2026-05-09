import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { getTimestamps } from '../api/client';

export default function Timeline({ videoId, onTimestampClick }) {
  const [timestamps, setTimestamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!videoId) return;

    const requestId = ++requestSeq.current;
    setTimestamps([]);

    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const data = await getTimestamps(videoId);
        if (requestSeq.current !== requestId) return;
        if (data && data.timestamps) {
          setTimestamps(data.timestamps);
        }
      } catch (err) {
        if (requestSeq.current !== requestId) return;
        console.error("Failed to fetch timeline", err);
      } finally {
        if (requestSeq.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();
    return () => {
      requestSeq.current += 1;
    };
  }, [videoId]);

  if (!videoId || timestamps.length === 0) {
    return null; // Don't show timeline if no video or no timestamps
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
        <Clock size={18} color="var(--accent-color)" /> Video Chapters
      </h3>
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading chapters...</p>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {timestamps.map((ts, idx) => (
            <button
              key={idx}
              onClick={() => onTimestampClick && onTimestampClick(ts.time)}
              style={{
                flexShrink: 0,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.5rem 1rem',
                minWidth: '120px'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-hover)', marginBottom: '0.25rem' }}>
                {formatTime(ts.time)}
              </span>
              <span style={{ fontSize: '0.9rem', textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {ts.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getSummaries } from '../api/v3Client';

export default function SummariesPanel({ videoId }) {
  const [data, setData] = useState(null);
  const [level, setLevel] = useState('standard');
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!videoId) return;
    getSummaries(videoId, level).then(d => { if (mounted) setData(d); }).catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [videoId, level]);

  if (!videoId) return <div style={{ padding: '1rem' }}>No video selected</div>;
  if (error) return <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Summaries</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {['eli5','standard','expert','tldr','visual'].map(l => (
          <button key={l} className={l===level? 'active-tab':''} onClick={() => setLevel(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>{data.summary}</div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getObjectives } from '../api/v3Client';

export default function ObjectivesPanel({ videoId, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!videoId) return;
    getObjectives(videoId).then((d) => { if (mounted) setData(d); }).catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [videoId, refreshKey]);

  if (!videoId) return <div style={{ padding: '1rem' }}>No video selected</div>;
  if (error) return <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Learning Objectives</h3>
      <ul>
        {data.objectives.map((o, i) => (
          <li key={i} style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontWeight: 600 }}>{data.learning_statements[i] || o}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bloom: {data.blooms[i]} • Coverage: {Math.round((data.coverage[i]||0)*100)}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useEffect, useState } from 'react';
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

  const objectives = Array.isArray(data.objectives) ? data.objectives : [];
  const learningStatements = Array.isArray(data.learning_statements) ? data.learning_statements : [];
  const blooms = Array.isArray(data.blooms) ? data.blooms : [];
  const coverage = Array.isArray(data.coverage) ? data.coverage : [];
  const checklist = Array.isArray(data.checklist) ? data.checklist : [];

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Learning Objectives</h3>
      <ul>
        {objectives.map((objective, i) => (
          <li key={i} style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontWeight: 600 }}>{learningStatements[i] || objective}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bloom: {blooms[i] || 'understand'} • Coverage: {Math.round((coverage[i] || 0) * 100)}%</div>
          </li>
        ))}
      </ul>

      {checklist.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Checklist</h4>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {checklist.map((item, index) => (
              <div key={index} style={{ border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ fontWeight: 600 }}>{item.objective}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Bloom: {item.bloom_level || 'understand'} • Coverage: {Number(item.coverage_percent || 0).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

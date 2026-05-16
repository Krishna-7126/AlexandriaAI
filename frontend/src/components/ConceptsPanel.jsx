import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getConcepts } from '../api/v3Client';

export default function ConceptsPanel({ videoId, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!videoId) return;
    getConcepts(videoId).then(d => { if (mounted) setData(d); }).catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [videoId, refreshKey]);

  if (!videoId) return <div style={{ padding: '1rem' }}>No video selected</div>;
  if (error) return <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Concepts</h3>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {data.tree.map((node, i) => (
          <div key={i} style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '0.5rem' }}>
            <div style={{ fontWeight: 700 }}>{node.name}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{node.definition}</div>
            {node.children && node.children.length > 0 && (
              <div style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                {node.children.map((c, idx) => <div key={idx} style={{ fontSize: '0.95rem' }}>• {c.name} — <span style={{ color: 'var(--text-secondary)' }}>{c.definition}</span></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

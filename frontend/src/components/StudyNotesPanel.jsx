import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getStudyNotes } from '../api/v3Client';

export default function StudyNotesPanel({ videoId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!videoId) return;
    getStudyNotes(videoId).then(d => { if (mounted) setData(d); }).catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [videoId]);

  if (!videoId) return <div style={{ padding: '1rem' }}>No video selected</div>;
  if (error) return <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <LoadingSpinner />;

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Study Notes</h3>
      <div style={{ marginBottom: '1rem' }}><strong>Summary</strong><div style={{ color: 'var(--text-secondary)' }}>{data.summary}</div></div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Outline</strong>
        {data.outline.map((section, idx) => (
          <div key={idx} style={{ marginTop: '0.5rem' }}>
            <div style={{ fontWeight: 700 }}>{section.heading}</div>
            <ul>
              {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Flashcards</strong>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {data.flashcards.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--outline-variant)', padding: '0.5rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700 }}>{f.front}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{f.back}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <strong>Glossary</strong>
        <ul>
          {data.glossary.map((g, i) => <li key={i}><b>{g.term}:</b> {g.definition}</li>)}
        </ul>
      </div>
    </div>
  );
}

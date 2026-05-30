import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getAnalytics } from '../api/v3Client';

export default function AnalyticsPanel({ userId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!userId) return;
    getAnalytics(userId).then(d => { if (mounted) setData(d); }).catch(e => { if (mounted) setError(e.message); });
    return () => { mounted = false; };
  }, [userId]);

  if (!userId) return <div style={{ padding: '1rem' }}>No user selected</div>;
  if (error) return <div style={{ padding: '1rem', color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <LoadingSpinner />;

  const progressMetrics = data.progress_metrics || {};
  const progressPercent = typeof data.progress_percent === 'number'
    ? data.progress_percent
    : (typeof progressMetrics.accuracy === 'number' ? progressMetrics.accuracy : 0);
  const weakConcepts = Array.isArray(data.weak_concepts) ? data.weak_concepts : [];

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Analytics</h3>
      <div>Concept Mastery: {data.concept_mastery}</div>
      <div>Learning Velocity: {data.learning_velocity}</div>
      <div>Time Spent (min): {data.time_spent_minutes}</div>
      <div>Quiz Accuracy: {typeof progressMetrics.accuracy === 'number' ? `${progressMetrics.accuracy}%` : 'n/a'}</div>
      <div>Attempts: {progressMetrics.attempts ?? 0}</div>
      <div>Correct: {progressMetrics.correct ?? 0}</div>
      {weakConcepts.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <strong>Weak Concepts</strong>
          <ul>
            {weakConcepts.map((concept, index) => (
              <li key={index}>{typeof concept === 'string' ? concept : concept?.name || 'Concept'}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: '0.5rem' }}><strong>Progress</strong></div>
      <div style={{ height: '8px', background: 'var(--surface-container)', borderRadius: 8, overflow: 'hidden', marginTop: '0.5rem' }}>
        <div style={{ width: `${Math.min(100, progressPercent || 0)}%`, height: '100%', background: 'var(--primary)' }} />
      </div>
    </div>
  );
}

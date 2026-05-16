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

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Analytics</h3>
      <div>Concept Mastery: {data.concept_mastery}</div>
      <div>Learning Velocity: {data.learning_velocity}</div>
      <div>Time Spent (min): {data.time_spent_minutes}</div>
      <div style={{ marginTop: '0.5rem' }}><strong>Progress</strong></div>
      <div style={{ height: '8px', background: 'var(--surface-container)', borderRadius: 8, overflow: 'hidden', marginTop: '0.5rem' }}>
        <div style={{ width: `${Math.min(100, data.progress_percent||0)}%`, height: '100%', background: 'var(--primary)' }} />
      </div>
    </div>
  );
}

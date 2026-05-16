export default function LoadingSpinner({ size = 36 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="spinner" style={{ width: size, height: size, borderRadius: '50%', border: '4px solid rgba(0,0,0,0.08)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

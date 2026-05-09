import React, { useState } from 'react';
import { Video, Loader2, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { ingestVideo, ingestFile } from '../api/client';

export default function IngestPanel({ onIngestSuccess }) {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const handleIngest = async (e) => {
    e.preventDefault();
    if (mode === 'url' && !url) return;
    if (mode === 'file' && !file) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const ingestResult = mode === 'url'
        ? await ingestVideo(url)
        : await ingestFile(file, title || file.name);
      setSuccess(true);
      setResult(ingestResult);
      
      // Extract YouTube ID from URL
      let ytId = null;
      if (mode === 'url') {
        try {
          const urlObj = new URL(url);
          if (urlObj.hostname.includes('youtube.com')) {
            ytId = urlObj.searchParams.get('v');
          } else if (urlObj.hostname === 'youtu.be') {
            ytId = urlObj.pathname.slice(1);
          }
        } catch (e) {
          console.warn('Could not parse YouTube ID');
        }
      }
      
      onIngestSuccess(ingestResult.video_id, ytId, ingestResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasRealTranscript = result && !['youtube_metadata', 'url_only'].includes(result.source);

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
        <Video color="var(--accent-color)" /> Load Video
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Analyze a YouTube URL or upload a local video/audio file.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" onClick={() => setMode('url')} style={{ opacity: mode === 'url' ? 1 : 0.7 }}>
          YouTube URL
        </button>
        <button type="button" onClick={() => setMode('file')} style={{ opacity: mode === 'file' ? 1 : 0.7 }}>
          <Upload size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> File Upload
        </button>
      </div>
      
      <form onSubmit={handleIngest} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {mode === 'url' ? (
          <input 
            type="text" 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="https://www.youtube.com/watch?v=..." 
            disabled={loading}
            style={{ flex: 1 }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            <input
              type="file"
              accept="audio/*,video/*"
              disabled={loading}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional title"
              disabled={loading}
              style={{ flex: 1 }}
            />
          </div>
        )}
        <button type="submit" disabled={loading || (mode === 'url' ? !url : !file)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loading ? (
            <><Loader2 className="animate-spin" size={18} /> Processing...</>
          ) : (
            'Analyze'
          )}
        </button>
      </form>

      {error && (
        <div className="fade-in" style={{ marginTop: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      
      {success && (
        <div className="fade-in" style={{ marginTop: '1rem', color: hasRealTranscript ? 'var(--success)' : '#fbbf24', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasRealTranscript ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {hasRealTranscript ? 'Video transcript processed successfully!' : 'Only video metadata was found. Q&A needs captions or uploaded audio/video.'}
          </div>
          {result && (
            <small style={{ opacity: 0.85, color: 'var(--text-secondary)' }}>
              ID: {result.video_id} • Source: {result.source || 'unknown'} • Chunks: {result.chunk_count ?? 0} • Words: {result.transcript_length ?? 0}
            </small>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Video, ArrowRight, Loader2, CheckCircle, AlertCircle, Upload, Copy, Plus } from 'lucide-react';
import { ingestVideo, ingestFile } from '../api/client';

export default function IngestPanel({ onIngestSuccess }) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const handleIngest = async (e) => {
    if (e) e.preventDefault();
    if (!url && !file) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const ingestResult = url 
        ? await ingestVideo(url)
        : await ingestFile(file, title || file.name);
      
      setSuccess(true);
      setResult(ingestResult);
      
      let ytId = null;
      if (url) {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUrl(''); // Clear URL if file is selected
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Bar Style Input */}
      <div className="glass-panel" style={{ 
        padding: '0.4rem', 
        borderRadius: '999px', 
        display: 'flex', 
        alignItems: 'center',
        gap: '0.5rem',
        background: '#121212',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
        border: '2px solid #16e059'
      }}>
        <div style={{ padding: '0 1.25rem', color: '#16e059' }}>
          <Video size={24} />
        </div>
        <input 
          type="text" 
          value={url} 
          onChange={(e) => {setUrl(e.target.value); setFile(null);}} 
          placeholder="Paste a video link or upload a video" 
          disabled={loading}
          style={{ 
            flex: 1, 
            border: 'none', 
            background: 'transparent', 
            color: '#fff',
            fontSize: '1.25rem',
            boxShadow: 'none',
            padding: '1rem 0',
            fontWeight: 500
          }}
        />
        <button 
          onClick={handleIngest}
          disabled={loading || (!url && !file)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#16e059',
            color: '#000',
            width: '80px',
            height: '60px',
            borderRadius: '999px',
            padding: 0
          }}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={28} />}
        </button>
      </div>

      {/* Sub-buttons Row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
         <button style={{ background: '#222', color: '#ccc', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => document.getElementById('file-input').click()}>
            <Upload size={16} /> Upload
         </button>
         <button style={{ background: '#222', color: '#ccc', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Copy size={16} /> YouTube Video Link
         </button>
         <button style={{ background: '#222', color: '#ccc', border: 'none', borderRadius: '12px', padding: '0.8rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Other Links
         </button>
      </div>

      <input 
        id="file-input"
        type="file" 
        hidden 
        onChange={handleFileChange}
        accept="audio/*,video/*,application/pdf"
      />

      {file && !loading && (
        <div className="fade-in glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-fixed)' }}>
           <span style={{ fontWeight: 600 }}>Selected: {file.name}</span>
           <button onClick={handleIngest} style={{ background: 'var(--primary)', color: '#fff' }}>Process File</button>
        </div>
      )}

      {error && (
        <div className="fade-in glass-panel" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--error-container)' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
    </div>
  );
}



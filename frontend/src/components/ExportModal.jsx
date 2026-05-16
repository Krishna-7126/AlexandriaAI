import { useState } from 'react';
import { X, Download, Loader } from 'lucide-react';
import { exportContent } from '../api/client';

const EXPORT_OPTIONS = [
  { id: 'pdf', name: 'PDF Document', icon: '📄', description: 'Formatted PDF with all content' },
  { id: 'markdown', name: 'Markdown', icon: '📝', description: 'Plain text markdown format' },
  { id: 'notion', name: 'Notion', icon: '🔗', description: 'Direct sync to Notion workspace' },
  { id: 'google-docs', name: 'Google Docs', icon: '📄', description: 'Create new Google Doc' },
  { id: 'docx', name: 'Word Document', icon: '📑', description: 'Microsoft Word format (.docx)' },
];

const CONTENT_OPTIONS = [
  { id: 'summary', name: 'Summary', icon: '📋' },
  { id: 'notes', name: 'Notes', icon: '📌' },
  { id: 'quiz-results', name: 'Quiz Results', icon: '✅' },
];

export default function ExportModal({ videoId, isOpen, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedContent, setSelectedContent] = useState('summary');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setError(null);
    setSuccess(false);
    setIsExporting(true);

    try {
      const result = await exportContent(videoId, selectedContent, selectedFormat);
      
      if (selectedFormat === 'pdf' || selectedFormat === 'markdown') {
        // Download file
        const blob = new Blob([result.content], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alexandria_${selectedContent}.${selectedFormat === 'pdf' ? 'pdf' : 'md'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For Notion/Google Docs, show auth prompt or success
        setSuccess(true);
      }

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[999] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-2xl mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Export Content</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✓ Export initiated successfully!
              </div>
            )}

            {/* Content Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What to Export?</h3>
              <div className="grid grid-cols-3 gap-3">
                {CONTENT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedContent(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedContent === option.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Format</h3>
              <div className="grid grid-cols-2 gap-3">
                {EXPORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFormat(option.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedFormat === option.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.name}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> {
                  selectedFormat === 'pdf' ? 'Download PDF with full formatting' :
                  selectedFormat === 'markdown' ? 'Perfect for GitHub or static sites' :
                  'Integrates with your cloud workspace'
                }
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="ml-auto px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

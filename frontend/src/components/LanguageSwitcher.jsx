import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getSupportedLanguages } from '../api/client';

export default function LanguageSwitcher() {
  const { user, updateLanguage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoading(true);
        const data = await getSupportedLanguages();
        setLanguages(data.languages || data.supported_languages || []);
      } catch (error) {
        console.error('Failed to load languages:', error);
        // Fallback languages
        setLanguages([
          { code: 'en-US', name: 'English', flag: '🇺🇸' },
          { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
          { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
          { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
          { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
          { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
          { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
          { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const currentLanguage = user?.preferred_language || 'en-US';
  const currentLanguageName = languages.find(l => l.code === currentLanguage)?.name || 'English';

  const handleLanguageChange = (code) => {
    updateLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Change Language"
      >
        <Globe size={20} className="text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currentLanguageName.split(' ')[0]}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Select Language</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading languages...</div>
              ) : (
                languages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${
                      currentLanguage === language.code ? 'bg-green-50' : ''
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{language.flag}</span>
                      <span className="font-medium text-gray-900">{language.name}</span>
                    </span>
                    {currentLanguage === language.code && (
                      <Check size={18} className="text-green-600" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
              💡 Content will be translated on demand
            </div>
          </div>
        </>
      )}
    </div>
  );
}

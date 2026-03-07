'use client';

import { useEffect, useState } from 'react';

const LANGUAGES = [
  { label: 'English', value: '/auto/en', native: 'English' },
  { label: 'Hindi', value: '/auto/hi', native: 'हिन्दी' },
  { label: 'Tamil', value: '/auto/ta', native: 'தமிழ்' },
  { label: 'Telugu', value: '/auto/te', native: 'తెలుగు' },
  { label: 'Bengali', value: '/auto/bn', native: 'বাংলা' },
  { label: 'Marathi', value: '/auto/mr', native: 'मराठी' },
  { label: 'Gujarati', value: '/auto/gu', native: 'ગુજરાતી' },
  { label: 'Kannada', value: '/auto/kn', native: 'ಕನ್ನಡ' },
  { label: 'Malayalam', value: '/auto/ml', native: 'മലയാളം' },
  { label: 'Punjabi', value: '/auto/pa', native: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [showPopup, setShowPopup] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const googCookie = cookies.find(c => c.trim().startsWith('googtrans='));
    
    if (googCookie) {
      const val = googCookie.split('=')[1];
      const lang = LANGUAGES.find(l => l.value === val);
      if (lang) setSelectedLanguage(lang.label);
    }

    const storedLang = localStorage.getItem('language_preference');
    if (!storedLang) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setSelectedLanguage(storedLang);
    }
  }, []);

  const googleTranslateElementInit = () => {
    // @ts-ignore
    new window.google.translate.TranslateElement({
      pageLanguage: 'auto',
      includedLanguages: 'en,hi,ta,te,bn,mr,gu,kn,ml,pa',
      autoDisplay: false,
    }, 'google_translate_element');
  };

  useEffect(() => {
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
      // @ts-ignore
      window.googleTranslateElementInit = googleTranslateElementInit;
    }
  }, []);

  const changeLanguage = (langLabel: string, langValue: string) => {
    document.cookie = `googtrans=${langValue}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${langValue}; path=/;`;
    localStorage.setItem('language_preference', langLabel);
    setSelectedLanguage(langLabel);
    setIsOpen(false);
    setShowPopup(false);
    window.location.reload();
  };

  const selectedLangObj = LANGUAGES.find(l => l.label === selectedLanguage);

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      <div className="relative z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium py-2 px-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.204 8.595l4.897 1.256a1.8 1.8 0 11-1.298 3.596l-3.38-4.62a8.001 8.001 0 00-5.922-2.812m8.704 6.784L21 21M3 21h18M3 21l8-8M21 21l-8-8" />
          </svg>
          <span className="notranslate hidden sm:inline">{selectedLangObj?.native || selectedLanguage}</span>
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1f3a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 max-h-80 overflow-y-auto"
            style={{ zIndex: 99999 }}
            onMouseLeave={() => setIsOpen(false)}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.label}
                onClick={() => changeLanguage(lang.label, lang.value)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors notranslate flex items-center justify-between ${
                  selectedLanguage === lang.label ? 'text-red-600 dark:text-red-400 font-semibold bg-red-500/10' : 'text-slate-700 dark:text-white/80'
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-xs opacity-70">{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            style={{ zIndex: 999998 }}
            onClick={() => setShowPopup(false)} 
          />
          <div className="bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-[#1a1f3a] dark:to-[#0a0e27] rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative border border-black/10 dark:border-white/10" style={{ zIndex: 999999 }}>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors"
              style={{ zIndex: 1000000 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-45">
                <svg className="-rotate-45 w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.204 8.595l4.897 1.256a1.8 1.8 0 11-1.298 3.596l-3.38-4.62a8.001 8.001 0 00-5.922-2.812m8.704 6.784L21 21M3 21h18M3 21l8-8M21 21l-8-8" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Choose Your Language</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm">अपनी भाषा चुनें / Select your preferred language</p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.label}
                  onClick={() => changeLanguage(lang.label, lang.value)}
                  className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all notranslate ${
                    selectedLanguage === lang.label
                      ? 'border-red-500 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                      : 'border-black/10 dark:border-white/10 hover:border-red-500/50 text-slate-700 dark:text-white/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{lang.label}</div>
                  <div>{lang.native}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

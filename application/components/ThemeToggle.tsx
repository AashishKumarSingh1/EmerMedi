'use client';

import { useTheme } from './ThemeProvider';
import { useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle theme"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isDark ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1a1f3a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 z-[9999]">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  theme === t.value
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                    : 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

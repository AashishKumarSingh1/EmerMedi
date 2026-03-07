'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileMenuProps {
  userName?: string;
}

export default function ProfileMenu({ userName }: ProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
          {userName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <svg 
          className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-700 dark:text-white/80 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-[#1a1f3a] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 z-[9999] overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            {userName && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-gray-400">Signed in as</p>
                <p className="text-slate-900 dark:text-white font-semibold truncate">{userName}</p>
              </div>
            )}

            <div className="py-2">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm sm:text-base">Profile</span>
              </Link>

              <Link
                href="/dashboard/medical-records"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm sm:text-base">Medical Records</span>
              </Link>

              <Link
                href="/dashboard/change-password"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="text-sm sm:text-base">Change Password</span>
              </Link>

              <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors w-full disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm sm:text-base">{loading ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

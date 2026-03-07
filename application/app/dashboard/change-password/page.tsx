'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileMenu from '@/components/ProfileMenu';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password changed successfully');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] text-slate-900 dark:text-white transition-colors duration-300">
      <nav className="border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg rotate-45">
              <span className="-rotate-45">+</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight notranslate">EmerMedi</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="text-xs sm:text-sm text-gray-400 hover:text-white hidden sm:block">
              ← Dashboard
            </Link>
            <ProfileMenu />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Change Password' }]} />
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Change Password</h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base">Update your account password</p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-none transition-colors duration-300">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm dark:shadow-none"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm dark:shadow-none"
              placeholder="Enter new password"
            />
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1.5">Minimum 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all shadow-sm dark:shadow-none"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 sm:py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:dark:bg-gray-700 disabled:text-slate-500 disabled:dark:text-gray-400 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:cursor-not-allowed text-white shadow-md dark:shadow-none"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 py-3 sm:py-3.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-semibold transition-all text-center text-slate-700 dark:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 dark:bg-transparent dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-blue-600/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 sm:p-6 transition-colors duration-300">
          <div className="flex gap-3 sm:gap-4">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 text-sm sm:text-base">Password Security Tips</h3>
              <ul className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed space-y-1">
                <li>• Use a strong password with at least 6 characters</li>
                <li>• Include a mix of letters, numbers, and symbols</li>
                <li>• Don't reuse passwords from other accounts</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

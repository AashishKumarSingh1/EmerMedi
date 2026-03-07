'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] invert dark:invert-0 pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />

      <div className="relative w-full max-w-md">
        <Breadcrumbs items={[{ label: 'Sign Up' }]} />
        
        <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl rotate-45">
            <span className="-rotate-45 text-white">+</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white notranslate">EmerMedi</span>
        </Link>

        <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base">Join the emergency response network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base"
                placeholder="Ashish Kumar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base"
                placeholder="ashish.kumar@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base"
                placeholder="••••••••"
              />
              <p className="text-xs text-slate-500 dark:text-gray-500 mt-1.5">Minimum 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <p className="text-slate-600 dark:text-gray-400 text-xs sm:text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 dark:text-gray-500 text-xs mt-4 sm:mt-6">
          By signing up, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

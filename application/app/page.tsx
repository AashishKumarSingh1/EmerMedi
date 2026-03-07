import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015] invert dark:invert-0 pointer-events-none" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
      
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl rotate-45">
            <span className="-rotate-45">+</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight notranslate">EmerMedi</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          <Link href="/login" className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium hover:text-red-400 transition-colors">
            Login
          </Link>
          <Link href="/signup" className="px-3 sm:px-6 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs sm:text-sm font-medium transition-all hover:scale-105">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-16 sm:pt-32 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          <div className="space-y-6 sm:space-y-8">
            <div className="inline-block px-3 sm:px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs sm:text-sm font-medium mb-4">
              Emergency Medical Response System
            </div>
            
            <h1 className="text-4xl sm:text-7xl font-black leading-[0.95] tracking-tighter">
              <span className="block text-slate-900 dark:text-white">Critical Care</span>
              <span className="block bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-red-500 dark:via-red-400 dark:to-orange-400 bg-clip-text text-transparent">When Seconds</span>
              <span className="block text-slate-900 dark:text-white">Matter Most</span>
            </h1>
            
            <p className="text-base sm:text-xl text-slate-600 dark:text-gray-400 leading-relaxed max-w-xl">
              AI-powered emergency medical platform connecting patients, responders, and healthcare facilities in real-time. Faster response. Better outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link href="/signup" className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl text-base sm:text-lg font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
                Start Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/login" className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-black/10 dark:border-white/10 hover:border-red-500/50 rounded-xl text-base sm:text-lg font-semibold transition-all hover:bg-black/5 dark:hover:bg-white/5 text-center">
                Sign In
              </Link>
            </div>

            <div className="flex gap-6 sm:gap-12 pt-6 sm:pt-8 border-t border-black/5 dark:border-white/5">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-500 notranslate">24/7</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Active Monitoring</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-500 notranslate">&lt;3min</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Avg Response</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-500 notranslate">99.9%</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">Uptime</div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0 group perspective-1000 animate-[float_6s_ease-in-out_infinite]">
            {/* Pronounced Glow Behind Card - Now pulsing continuously */}
            <div className="absolute -inset-1 bg-linear-to-br from-red-500/30 via-transparent to-blue-500/30 blur-2xl opacity-50 animate-pulse transition-opacity duration-700 group-hover:opacity-100" />
            
            {/* Main Glassmorphic Card */}
            <div className="relative bg-white/80 dark:bg-[#0b0f24]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-6 overflow-hidden transform transition-all duration-700 hover:scale-[1.02]">
              
              {/* Continuous scanning line overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/5 dark:via-white/3 to-transparent h-1/2 opacity-50 pointer-events-none animate-[scan_4s_ease-in-out_infinite]" />

              {/* Subtle sweeping animated gradient background line */}
              <div className="absolute inset-0 bg-linear-to-tr from-black/5 via-black/10 dark:from-white/1 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex items-center justify-between p-3 sm:p-4 bg-linear-to-r from-red-500/20 to-red-500/5 hover:from-red-500/30 transition-colors border border-red-500/30 rounded-xl relative overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                  <div className="relative flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                  </div>
                  <span className="font-semibold text-sm sm:text-base text-red-700 dark:text-red-100 tracking-wide">Emergency Alert Active</span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-50 text-shadow-sm bg-red-600/40 animate-pulse px-2 py-1 rounded-md border border-red-500/30">L I V E</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 relative z-10">
                {[
                  { label: 'Patient Status', value: 'Stable', color: 'text-green-600 dark:text-green-400' },
                  { label: 'ETA', value: '2 min 34 sec', color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: 'Nearest Facility', value: 'City Hospital', color: 'text-blue-600 dark:text-blue-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 sm:p-4 bg-linear-to-r from-black/5 to-transparent dark:from-white/3 dark:to-white/1 hover:from-black/10 dark:hover:from-white/8 dark:hover:to-white/3 transition-all rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 group/item relative overflow-hidden">
                    {/* Background sweep animation inside list item */}
                    <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-black/20 dark:via-white/10 to-transparent transform -translate-x-full animate-[shimmer_2s_infinite] opacity-0 group-hover/item:opacity-100 transition-opacity" style={{animationDelay: `${i * 300}ms`}} />
                    
                    <span className="text-slate-600 dark:text-gray-400 text-sm sm:text-base group-hover/item:text-slate-900 dark:group-hover/item:text-gray-300 transition-colors">{item.label}</span>
                    <div className="flex items-center gap-2">
                       {/* Blinking dot before value */}
                      <div className={`w-1.5 h-1.5 rounded-full ${item.color.replace(/text-/g, 'bg-')} animate-pulse opacity-70`} />
                      <span className={`font-semibold text-sm sm:text-base ${item.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 relative z-10">
                {['Heart Rate', 'BP', 'O2 Level'].map((metric, i) => (
                  <div key={i} className="p-3 sm:p-4 bg-black/2 hover:bg-black/5 dark:bg-white/2 dark:hover:bg-white/6 transition-all duration-300 rounded-xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 text-center group/stat relative overflow-hidden flex flex-col items-center justify-center min-h-[80px] sm:min-h-[96px]">
                    {/* Inner animated glow */}
                    <div className={`absolute inset-0 bg-linear-to-b from-transparent to-red-500/5 opacity-0 animate-pulse transition-opacity duration-1000`} style={{animationDelay: `${i * 500}ms`, opacity: 0.5}} />
                    
                    {/* Hover highlight line */}
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-black/20 dark:via-white/20 to-transparent transform scale-x-0 group-hover/stat:scale-x-100 transition-transform duration-500" />
                    
                    {/* Simulated EKG Waveform */}
                    <div className="flex items-end justify-center gap-[2px] h-6 mb-2">
                       {[...Array(8)].map((_, barIndex) => (
                         <div 
                           key={barIndex} 
                           className="w-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm opacity-80 animate-[waveform_1.5s_ease-in-out_infinite]"
                           style={{
                             animationDelay: `${(i * 300) + (barIndex * 150)}ms`,
                             height: '4px'
                           }}
                         />
                       ))}
                    </div>
                    <div className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-gray-500 group-hover/stat:text-slate-700 dark:group-hover/stat:text-gray-400 uppercase tracking-wider relative z-10">{metric}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

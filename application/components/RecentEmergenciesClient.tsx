'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

interface Emergency {
  _id: string;
  type: 'audio' | 'image';
  result: any;
  fileUrl: string;
  isEmergency: boolean;
  createdAt: string;
}

interface RecentEmergenciesClientProps {
  initialEmergencies: Emergency[];
}

export default function RecentEmergenciesClient({ initialEmergencies }: RecentEmergenciesClientProps) {
  const [emergencies, setEmergencies] = useState<Emergency[]>(initialEmergencies);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmergencies = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/diagnosis-history?limit=5&emergencyOnly=true');
      const data = await response.json();
      if (data.history) {
        setEmergencies(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmergencies();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    fetchEmergencies();
  };

  return (
    <div className="lg:col-span-2 bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">Recent Emergencies</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            href="/dashboard/diagnosis-history"
            className="px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {emergencies.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-600 dark:text-gray-400 text-sm">No emergency diagnoses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emergencies.map((emergency) => (
            <div key={emergency._id} className="flex gap-3 p-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              {/* Small Image Preview */}
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10">
                {emergency.type === 'image' ? (
                  <img
                    src={emergency.fileUrl}
                    alt="Emergency"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-0.5">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm">Emergency Detected</h3>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                    Critical
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-1 mb-0.5">
                  {emergency.type === 'audio' 
                    ? `${emergency.result.emotion} - ${emergency.result.category}`
                    : emergency.result.reason?.substring(0, 60) + '...'
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-500">
                  {new Date(emergency.createdAt).toLocaleDateString()} • {new Date(emergency.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

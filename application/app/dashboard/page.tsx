import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import LanguageSelector from '@/components/LanguageSelector';
import ProfileMenu from '@/components/ProfileMenu';
import ThemeToggle from '@/components/ThemeToggle';
import EmergencySOSButton from '@/components/EmergencySOSButton';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const db = await getDatabase();
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
  const profile = await db.collection('profiles').findOne({ userId: session.userId });
  const medicalRecords = await db.collection('medical_records').findOne({ userId: session.userId });

  // Calculate profile completion
  const profileFields = ['name', 'dob', 'gender', 'bloodGroup', 'phoneNumber', 'emergencyContact1'];
  const completedFields = profileFields.filter(field => profile?.[field]).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  // Check medical records
  const hasMedicalRecords = medicalRecords && (
    (medicalRecords.oldDiseases?.length > 0) ||
    (medicalRecords.currentDiseases?.length > 0) ||
    (medicalRecords.currentMedicines?.length > 0)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] text-slate-900 dark:text-white transition-colors duration-300">
      <nav className="border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg rotate-45">
              <span className="-rotate-45">+</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight notranslate">EmerMedi</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <LanguageSelector />
            <ProfileMenu userName={user?.name} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Emergency Dashboard</h1>
          <p className="text-slate-600 dark:text-gray-400 text-sm sm:text-base">Real-time monitoring and response coordination</p>
        </div>

        {/* Profile Completion & Medical Records Alert */}
        {(profileCompletion < 100 || !hasMedicalRecords) && (
          <div className="mb-6 sm:mb-8 space-y-4">
            {profileCompletion < 100 && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 mb-2">Complete Your Profile</h3>
                    <p className="text-sm text-slate-700 dark:text-gray-400 mb-4">Your profile is {profileCompletion}% complete. Complete your profile to help emergency responders assist you better.</p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-700 dark:text-gray-400">Profile Completion</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-500">{profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2.5 rounded-full transition-all" style={{ width: `${profileCompletion}%` }}></div>
                      </div>
                    </div>
                    <Link href="/dashboard/profile" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-all">
                      Complete Profile
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!hasMedicalRecords && (
              <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Add Medical Records</h3>
                    <p className="text-sm text-slate-700 dark:text-gray-400 mb-4">Your medical records are empty. Adding your medical history, current medications, and allergies can be life-saving in emergency situations.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href="/dashboard/medical-records" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-all">
                        Add Medical Records
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>All data is encrypted & secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            { label: 'Active Cases', value: '12', change: '+3', color: 'red' },
            { label: 'Response Time', value: '2.4m', change: '-0.3m', color: 'green' },
            { label: 'Available Units', value: '8', change: '+2', color: 'blue' },
            { label: 'Resolved Today', value: '47', change: '+12', color: 'yellow' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-2">{stat.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-2xl sm:text-3xl font-bold notranslate">{stat.value}</div>
                <div className={`text-xs sm:text-sm font-medium notranslate ${stat.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Recent Emergencies</h2>
              <div className="flex gap-2">
                <button className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                  Critical
                </button>
                <button className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-gray-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { id: 'EM-2847', type: 'Cardiac Arrest', location: 'Downtown Plaza', status: 'In Progress', priority: 'Critical' },
                { id: 'EM-2846', type: 'Traffic Accident', location: 'Highway 101', status: 'Dispatched', priority: 'High' },
                { id: 'EM-2845', type: 'Respiratory Distress', location: 'Oak Street', status: 'Resolved', priority: 'Medium' },
              ].map((emergency, i) => (
                <div key={i} className="p-3 sm:p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white mb-1 text-sm sm:text-base">{emergency.type}</div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-gray-400"><span className="notranslate">{emergency.id}</span> • {emergency.location}</div>
                    </div>
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      emergency.priority === 'Critical' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                      emergency.priority === 'High' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' :
                      'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {emergency.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      emergency.status === 'In Progress' ? 'bg-yellow-500 dark:bg-yellow-400 animate-pulse' :
                      emergency.status === 'Dispatched' ? 'bg-blue-500 dark:bg-blue-400' :
                      'bg-green-500 dark:bg-green-400'
                    }`} />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">{emergency.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Emergency SOS Button - Prominent placement */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20 border-2 border-red-500/30 dark:border-red-500/40 rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-red-700 dark:text-red-400 mb-1">Emergency Diagnosis</h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">AI-powered emergency assessment</p>
              </div>
              <EmergencySOSButton />
            </div>

            <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/dashboard/profile" className="block w-full py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all hover:scale-[1.02] text-sm sm:text-base text-center text-white">
                  Manage Profile
                </Link>
                <Link href="/dashboard/medical-records" className="block w-full py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all hover:scale-[1.02] text-sm sm:text-base text-center text-white">
                  Medical Records
                </Link>
                <button className="w-full py-2.5 sm:py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-medium transition-all text-sm sm:text-base text-slate-800 dark:text-white border border-black/5 dark:border-transparent">
                  View Map
                </button>
                <button className="w-full py-2.5 sm:py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-medium transition-all text-sm sm:text-base text-slate-800 dark:text-white border border-black/5 dark:border-transparent">
                  Contact Dispatch
                </button>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
              <h2 className="text-lg sm:text-xl font-bold mb-4">System Status</h2>
              <div className="space-y-3">
                {[
                  { name: 'GPS Tracking', status: 'Operational' },
                  { name: 'Communication', status: 'Operational' },
                  { name: 'Database', status: 'Operational' },
                ].map((system, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">{system.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
                      <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">{system.status}</span>
                    </div>
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

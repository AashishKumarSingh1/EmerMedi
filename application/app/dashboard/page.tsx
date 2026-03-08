import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import LanguageSelector from '@/components/LanguageSelector';
import ProfileMenu from '@/components/ProfileMenu';
import ThemeToggle from '@/components/ThemeToggle';
import EmergencySOSButton from '@/components/EmergencySOSButton';
import RecentEmergenciesClient from '@/components/RecentEmergenciesClient';
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

  // Fetch recent critical diagnoses
  const recentEmergencies = await db
    .collection('diagnosis_history')
    .find({ userId: session.userId, isEmergency: true })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  // Calculate real statistics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Total diagnosis count
  const totalDiagnoses = await db
    .collection('diagnosis_history')
    .countDocuments({ userId: session.userId });
  
  // Emergency diagnoses count
  const emergencyCount = await db
    .collection('diagnosis_history')
    .countDocuments({ userId: session.userId, isEmergency: true });
  
  // Today's diagnoses
  const todayDiagnoses = await db
    .collection('diagnosis_history')
    .countDocuments({ 
      userId: session.userId, 
      createdAt: { $gte: todayStart } 
    });
  
  // Non-emergency (safe) diagnoses
  const safeDiagnoses = await db
    .collection('diagnosis_history')
    .countDocuments({ userId: session.userId, isEmergency: false });

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
          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-2">Total Diagnoses</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold notranslate">{totalDiagnoses}</div>
              <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                All Time
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-2">Emergencies</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold notranslate text-red-600 dark:text-red-400">{emergencyCount}</div>
              <div className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
                Critical
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-2">Safe Diagnoses</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold notranslate text-green-600 dark:text-green-400">{safeDiagnoses}</div>
              <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                Non-Emergency
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-2">Today's Scans</div>
            <div className="flex items-end justify-between">
              <div className="text-2xl sm:text-3xl font-bold notranslate">{todayDiagnoses}</div>
              <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                Today
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <RecentEmergenciesClient initialEmergencies={recentEmergencies.map(e => ({
            ...e,
            _id: e._id.toString()
          })) as any} />

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
                <Link href="/dashboard/diagnosis-history" className="block w-full py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-all hover:scale-[1.02] text-sm sm:text-base text-center text-white">
                  Diagnosis History
                </Link>
                <button className="w-full py-2.5 sm:py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-medium transition-all text-sm sm:text-base text-slate-800 dark:text-white border border-black/5 dark:border-transparent">
                  View Map
                </button>
                <button className="w-full py-2.5 sm:py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-medium transition-all text-sm sm:text-base text-slate-800 dark:text-white border border-black/5 dark:border-transparent">
                  Contact Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

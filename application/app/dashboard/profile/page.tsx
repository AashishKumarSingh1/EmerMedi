'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileMenu from '@/components/ProfileMenu';
import Breadcrumbs from '@/components/Breadcrumbs';

interface FamilyRelation {
  _id: string;
  name: string;
  relation: string;
  mobile: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    phoneNumber: '',
    emergencyContact1: '',
    emergencyContact2: '',
    aadharCard: '',
    ayushmanCard: '',
    profileImage: '',
    familyRelations: [] as FamilyRelation[],
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Auto-save whenever formData changes (after initial load)
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formData, loading]);

  const autoSave = async () => {
    // Validate required fields before auto-saving
    if (!formData.name || !formData.dob || !formData.gender || !formData.phoneNumber) {
      return; // Don't auto-save if required fields are missing
    }

    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage('Auto-saved successfully');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        const profile = data.profile;
        setFormData({
          name: profile.name || '',
          dob: profile.dob || '',
          gender: profile.gender || '',
          bloodGroup: profile.bloodGroup || '',
          phoneNumber: profile.phoneNumber || '',
          emergencyContact1: profile.emergencyContact1 || '',
          emergencyContact2: profile.emergencyContact2 || '',
          aadharCard: profile.aadharCard || '',
          ayushmanCard: profile.ayushmanCard || '',
          profileImage: profile.profileImage || '',
          familyRelations: profile.familyRelations || [],
        });
        setUserName(profile.name || '');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const addFamilyRelation = () => {
    setFormData({
      ...formData,
      familyRelations: [
        ...formData.familyRelations,
        { _id: Date.now().toString(), name: '', relation: '', mobile: '' },
      ],
    });
  };

  const removeFamilyRelation = (id: string) => {
    setFormData({
      ...formData,
      familyRelations: formData.familyRelations.filter((rel) => rel._id !== id),
    });
  };

  const updateFamilyRelation = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      familyRelations: formData.familyRelations.map((rel) =>
        rel._id === id ? { ...rel, [field]: value } : rel
      ),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image size must be less than 10MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage('Only JPG and PNG images are allowed');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        const updatedFormData = { ...formData, profileImage: data.url };
        setFormData(updatedFormData);
        setMessage('Image uploaded successfully');
        setTimeout(() => setMessage(''), 3000);
        
        // Auto-save profile with new image
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFormData),
        });
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] flex items-center justify-center transition-colors duration-300">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    );
  }

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
            <ProfileMenu userName={userName} />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Profile' }]} />
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Profile Management</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your personal and medical information securely</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message}
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Personal Information</h2>
            
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pb-6 border-b border-white/10">
              <div className="relative">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-red-500/20"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-4xl sm:text-5xl font-bold border-4 border-red-500/20 text-white">
                    {formData.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white">Profile Picture</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">JPG or PNG, max 10MB</p>
                {uploading && <p className="text-sm text-blue-600 dark:text-blue-400">Uploading...</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="Rajesh Kumar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Gender</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Emergency Contact 1</label>
                <input
                  type="tel"
                  value={formData.emergencyContact1}
                  onChange={(e) => setFormData({ ...formData, emergencyContact1: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Emergency Contact 2</label>
                <input
                  type="tel"
                  value={formData.emergencyContact2}
                  onChange={(e) => setFormData({ ...formData, emergencyContact2: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Aadhar Card Number</label>
                <input
                  type="text"
                  value={formData.aadharCard}
                  onChange={(e) => setFormData({ ...formData, aadharCard: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="1234-5678-9012"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Ayushman Bharat Card</label>
                <input
                  type="text"
                  value={formData.ayushmanCard}
                  onChange={(e) => setFormData({ ...formData, ayushmanCard: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all text-sm sm:text-base shadow-sm dark:shadow-none"
                  placeholder="AB-1234567890"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Family Relations</h2>
              <button
                type="button"
                onClick={addFamilyRelation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-all"
              >
                + Add
              </button>
            </div>

            <div className="space-y-4">
              {formData.familyRelations.map((relation, index) => (
                <div key={relation._id} className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-lg">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={relation.name}
                      onChange={(e) => updateFamilyRelation(relation._id, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 text-sm sm:text-base shadow-sm dark:shadow-none"
                    />
                    <input
                      type="text"
                      placeholder="Relation"
                      value={relation.relation}
                      onChange={(e) => updateFamilyRelation(relation._id, 'relation', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 text-sm sm:text-base shadow-sm dark:shadow-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="Mobile"
                        value={relation.mobile}
                        onChange={(e) => updateFamilyRelation(relation._id, 'mobile', e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500/50 text-sm sm:text-base shadow-sm dark:shadow-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFamilyRelation(relation._id)}
                        className="px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-600 dark:text-red-400 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-transparent dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-blue-600/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 sm:p-6 transition-colors duration-300">
            <div className="flex gap-3 sm:gap-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-400 mb-2 text-sm sm:text-base">Data Security & Privacy</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                  Your medical data is encrypted using AES-256-GCM encryption before storage. Sensitive information like Aadhar numbers are hashed and never stored in plain text. We comply with government regulations and never share your data with third parties without explicit consent.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 flex items-center gap-3 py-3 sm:py-3.5 px-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Auto-saving...</span>
                </>
              ) : message ? (
                <>
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">{message}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">All changes saved</span>
                </>
              )}
            </div>
            <Link
              href="/dashboard/medical-records"
              className="flex-1 py-3 sm:py-3.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-semibold transition-all text-center text-sm sm:text-base text-slate-700 dark:text-white"
            >
              Manage Medical Records →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

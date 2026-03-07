'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileMenu from '@/components/ProfileMenu';
import Breadcrumbs from '@/components/Breadcrumbs';
import Modal from '@/components/Modal';
import { 
  Plus, 
  Trash2, 
  Activity, 
  Pill, 
  Stethoscope, 
  HeartPulse, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  Building2,
  Syringe
} from 'lucide-react';

interface Disease {
  _id: string;
  name: string;
  diagnosedDate: string;
  notes: string;
  stage?: string;
}

interface Treatment {
  _id: string;
  name: string;
  startDate: string;
  doctor: string;
  hospital: string;
  notes: string;
}

interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  notes: string;
}

interface Surgery {
  _id: string;
  name: string;
  date: string;
  hospital: string;
  surgeon: string;
  notes: string;
}

export default function MedicalRecordsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [userName, setUserName] = useState('');
  
  const [formData, setFormData] = useState({
    oldDiseases: [] as Disease[],
    currentDiseases: [] as Disease[],
    ongoingTreatments: [] as Treatment[],
    currentMedicines: [] as Medicine[],
    recentSurgeries: [] as Surgery[],
  });

  // Modal States
  const [isOldDiseaseModalOpen, setOldDiseaseModalOpen] = useState(false);
  const [isCurrentDiseaseModalOpen, setCurrentDiseaseModalOpen] = useState(false);
  const [isTreatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [isMedicineModalOpen, setMedicineModalOpen] = useState(false);
  const [isSurgeryModalOpen, setSurgeryModalOpen] = useState(false);

  // Temporary Form States for Modals
  const [newOldDisease, setNewOldDisease] = useState<Partial<Disease>>({});
  const [newCurrentDisease, setNewCurrentDisease] = useState<Partial<Disease>>({});
  const [newTreatment, setNewTreatment] = useState<Partial<Treatment>>({});
  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({});
  const [newSurgery, setNewSurgery] = useState<Partial<Surgery>>({});

  useEffect(() => {
    fetchRecords();
    fetchUserName();
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
    try {
      setSaving(true);
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ text: 'Auto-saved successfully', type: 'success' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile?.name) {
        setUserName(data.profile.name);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/medical-records');
      const data = await res.json();
      if (data.records) {
        setFormData(data.records);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  };

  // --- Handlers for Adding ---
  const handleAddOldDisease = () => {
    if (!newOldDisease.name) return;
    setFormData({
      ...formData,
      oldDiseases: [...formData.oldDiseases, { _id: Date.now().toString(), name: newOldDisease.name || '', diagnosedDate: newOldDisease.diagnosedDate || '', notes: newOldDisease.notes || '' }],
    });
    setNewOldDisease({});
    setOldDiseaseModalOpen(false);
  };

  const handleAddCurrentDisease = () => {
    if (!newCurrentDisease.name) return;
    setFormData({
      ...formData,
      currentDiseases: [...formData.currentDiseases, { _id: Date.now().toString(), name: newCurrentDisease.name || '', stage: newCurrentDisease.stage || '', diagnosedDate: newCurrentDisease.diagnosedDate || '', notes: newCurrentDisease.notes || '' }],
    });
    setNewCurrentDisease({});
    setCurrentDiseaseModalOpen(false);
  };

  const handleAddTreatment = () => {
    if (!newTreatment.name) return;
    setFormData({
      ...formData,
      ongoingTreatments: [...formData.ongoingTreatments, { _id: Date.now().toString(), name: newTreatment.name || '', startDate: newTreatment.startDate || '', doctor: newTreatment.doctor || '', hospital: newTreatment.hospital || '', notes: newTreatment.notes || '' }],
    });
    setNewTreatment({});
    setTreatmentModalOpen(false);
  };

  const handleAddMedicine = () => {
    if (!newMedicine.name) return;
    setFormData({
      ...formData,
      currentMedicines: [...formData.currentMedicines, { _id: Date.now().toString(), name: newMedicine.name || '', dosage: newMedicine.dosage || '', frequency: newMedicine.frequency || '', prescribedBy: newMedicine.prescribedBy || '', startDate: newMedicine.startDate || '', notes: newMedicine.notes || '' }],
    });
    setNewMedicine({});
    setMedicineModalOpen(false);
  };

  const handleAddSurgery = () => {
    if (!newSurgery.name) return;
    setFormData({
      ...formData,
      recentSurgeries: [...formData.recentSurgeries, { _id: Date.now().toString(), name: newSurgery.name || '', date: newSurgery.date || '', hospital: newSurgery.hospital || '', surgeon: newSurgery.surgeon || '', notes: newSurgery.notes || '' }],
    });
    setNewSurgery({});
    setSurgeryModalOpen(false);
  };

  // --- Helpers for Removals ---
  const removeOldDisease = (id: string) => setFormData({ ...formData, oldDiseases: formData.oldDiseases.filter(d => d._id !== id) });
  const removeCurrentDisease = (id: string) => setFormData({ ...formData, currentDiseases: formData.currentDiseases.filter(d => d._id !== id) });
  const removeTreatment = (id: string) => setFormData({ ...formData, ongoingTreatments: formData.ongoingTreatments.filter(t => t._id !== id) });
  const removeMedicine = (id: string) => setFormData({ ...formData, currentMedicines: formData.currentMedicines.filter(m => m._id !== id) });
  const removeSurgery = (id: string) => setFormData({ ...formData, recentSurgeries: formData.recentSurgeries.filter(s => s._id !== id) });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060813] flex flex-col items-center justify-center transition-colors duration-500">
        <Activity className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
        <div className="text-slate-900 dark:text-white font-medium text-lg tracking-wide">Syncing Medical Data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060813] text-slate-900 dark:text-slate-200 transition-colors duration-500 font-sans selection:bg-blue-500/30">
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000" />
        <div className="absolute bottom-0 right-1/4 w-120 h-120 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-screen transition-opacity duration-1000" />
      </div>

      <nav className="border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-[#0a0f1c]/70 backdrop-blur-2xl sticky top-0 z-40 transition-colors duration-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-linear-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              EmerMedi
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/50 hidden sm:block"></div>
            <ProfileMenu userName={userName} />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <Breadcrumbs items={[{ label: 'Medical Records' }]} />
        
        <div className="mb-8 sm:mb-16 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 text-slate-900 dark:text-white">
            Comprehensive <br/>
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-500">Medical Dossier</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
            Keep your health history current. This data ensures responders have critical context during emergencies.
          </p>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400'}`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
            <p className="font-medium text-sm">{message.text}</p>
          </div>
        )}

        <div className="space-y-8 sm:space-y-12">
          
          {/* Section: Past Medical History */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl">
                  <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Past History</h2>
              </div>
              <button type="button" onClick={() => setOldDiseaseModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Record
              </button>
            </div>
            
            {formData.oldDiseases.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                <HeartPulse className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No past diseases recorded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.oldDiseases.map((disease) => (
                  <div key={disease._id} className="group p-5 bg-white dark:bg-[#12163b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => removeOldDisease(disease._id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Delete record">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 pr-10">{disease.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                      <Calendar className="w-4 h-4" /> {disease.diagnosedDate || 'Date not specified'}
                    </div>
                    {disease.notes && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{disease.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Current Conditions */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-red-100 dark:bg-red-500/10 rounded-xl">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Current Conditions</h2>
              </div>
              <button type="button" onClick={() => setCurrentDiseaseModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Condition
              </button>
            </div>
            
            {formData.currentDiseases.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No current conditions documented.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.currentDiseases.map((disease) => (
                  <div key={disease._id} className="group p-5 bg-white dark:bg-[#12163b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => removeCurrentDisease(disease._id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 pl-2 pr-10">{disease.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mb-3 pl-2">
                      {disease.stage && <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-semibold uppercase tracking-wider">Stage: {disease.stage}</span>}
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {disease.diagnosedDate || 'Date missing'}</span>
                    </div>
                    {disease.notes && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 ml-2 rounded-lg border border-slate-100 dark:border-slate-800">{disease.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Ongoing Treatments */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                  <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Active Treatments</h2>
              </div>
              <button type="button" onClick={() => setTreatmentModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Treatment
              </button>
            </div>
            
            {formData.ongoingTreatments.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                <Stethoscope className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No ongoing treatments.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {formData.ongoingTreatments.map((treatment) => (
                  <div key={treatment._id} className="group p-5 sm:p-6 bg-white dark:bg-[#12163b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all relative">
                    <div className="absolute top-0 right-0 p-4 sm:p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => removeTreatment(treatment._id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="sm:flex items-start justify-between pr-12">
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-slate-900 dark:text-white mb-2">{treatment.name}</h3>
                        <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-600 dark:text-slate-400 mb-4">
                          <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-slate-400" /> Dr. {treatment.doctor || 'Unknown'}</div>
                          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> {treatment.hospital || 'Unknown Facility'}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> Started: {treatment.startDate || 'N/A'}</div>
                        </div>
                        {treatment.notes && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">{treatment.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Medicines */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                  <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Current Medicines</h2>
              </div>
              <button type="button" onClick={() => setMedicineModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Medication
              </button>
            </div>
            
            {formData.currentMedicines.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No active medications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.currentMedicines.map((medicine) => (
                  <div key={medicine._id} className="group p-5 bg-white dark:bg-[#12163b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => removeMedicine(medicine._id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-start gap-4 pr-10">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl shrink-0 mt-1">
                        <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{medicine.name}</h3>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-2">{medicine.dosage} • {medicine.frequency}</p>
                        <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                          {medicine.prescribedBy && <p>By: {medicine.prescribedBy}</p>}
                          {medicine.startDate && <p>Since: {medicine.startDate}</p>}
                        </div>
                        {medicine.notes && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{medicine.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section: Surgeries */}
          <section>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
                  <Syringe className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Post-ops</h2>
              </div>
              <button type="button" onClick={() => setSurgeryModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors">
                <Plus className="w-4 h-4" /> Add Surgery
              </button>
            </div>
            
            {formData.recentSurgeries.length === 0 ? (
              <div className="py-12 px-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
                <Syringe className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No surgical history.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.recentSurgeries.map((surgery) => (
                  <div key={surgery._id} className="group p-5 bg-white dark:bg-[#12163b] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all relative">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => removeSurgery(surgery._id)} className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 pr-10">{surgery.name}</h3>
                    <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400 mb-4">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {surgery.date || 'Unknown Date'}</div>
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> {surgery.hospital || 'Unknown Hospital'}</div>
                      <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-slate-400" /> {surgery.surgeon || 'Unknown Surgeon'}</div>
                    </div>
                    {surgery.notes && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{surgery.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Privacy Banner */}
          <div className="mt-12 bg-slate-900 dark:bg-blue-900/20 border border-slate-800 dark:border-blue-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row gap-5 relative z-10">
              <div className="p-4 bg-white/10 dark:bg-blue-500/20 backdrop-blur-md rounded-2xl shrink-0 self-start">
                <ShieldCheck className="w-8 h-8 text-white dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Enterprise-Grade Security</h3>
                <p className="text-slate-400 dark:text-blue-200/70 leading-relaxed font-medium">
                  Your medical dossier is secured with AES-256 encryption at rest and in transit. This platform strictly complies with state healthcare privacy protocols. Your records are only accessed by verified emergency responders when necessary.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {saving && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Activity className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Auto-saving...</span>
                </div>
              )}
              {message && (
                <div className={`flex items-center gap-2 ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
              )}
              {!saving && !message && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">All changes saved</span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Changes are automatically saved
            </div>
          </div>
        </div>
      </main>

      {/* --- Modals for Data Entry --- */}
      
      {/* 1. Old Disease Modal */}
      <Modal isOpen={isOldDiseaseModalOpen} onClose={() => setOldDiseaseModalOpen(false)} title="Add Past Disease">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Disease Name*</label>
            <input type="text" value={newOldDisease.name || ''} onChange={(e) => setNewOldDisease({ ...newOldDisease, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-slate-400" placeholder="e.g. Asthma (Childhood)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Diagnosed Date</label>
            <input type="date" value={newOldDisease.diagnosedDate || ''} onChange={(e) => setNewOldDisease({ ...newOldDisease, diagnosedDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <textarea value={newOldDisease.notes || ''} onChange={(e) => setNewOldDisease({ ...newOldDisease, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-400" rows={3} placeholder="Any complications or successful treatments?" />
          </div>
          <button onClick={handleAddOldDisease} disabled={!newOldDisease.name} className="w-full py-3 mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-xl disabled:opacity-50 transition-transform active:scale-95">Add to History</button>
        </div>
      </Modal>

      {/* 2. Current Disease Modal */}
      <Modal isOpen={isCurrentDiseaseModalOpen} onClose={() => setCurrentDiseaseModalOpen(false)} title="Add Current Condition">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Condition Name*</label>
            <input type="text" value={newCurrentDisease.name || ''} onChange={(e) => setNewCurrentDisease({ ...newCurrentDisease, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="e.g. Type 2 Diabetes" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stage/Severity</label>
              <input type="text" value={newCurrentDisease.stage || ''} onChange={(e) => setNewCurrentDisease({ ...newCurrentDisease, stage: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="e.g. Moderate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Diagnosed</label>
              <input type="date" value={newCurrentDisease.diagnosedDate || ''} onChange={(e) => setNewCurrentDisease({ ...newCurrentDisease, diagnosedDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Management Notes</label>
            <textarea value={newCurrentDisease.notes || ''} onChange={(e) => setNewCurrentDisease({ ...newCurrentDisease, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" rows={3} placeholder="Details about managing this condition." />
          </div>
          <button onClick={handleAddCurrentDisease} disabled={!newCurrentDisease.name} className="w-full py-3 mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-transform active:scale-95">Add Condition</button>
        </div>
      </Modal>

      {/* 3. Treatment Modal */}
      <Modal isOpen={isTreatmentModalOpen} onClose={() => setTreatmentModalOpen(false)} title="Add Active Treatment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Treatment Name*</label>
            <input type="text" value={newTreatment.name || ''} onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="e.g. Physical Therapy" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Doctor Name</label>
              <input type="text" value={newTreatment.doctor || ''} onChange={(e) => setNewTreatment({ ...newTreatment, doctor: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="Dr. Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Hospital/Clinic</label>
              <input type="text" value={newTreatment.hospital || ''} onChange={(e) => setNewTreatment({ ...newTreatment, hospital: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="City Gen" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
            <input type="date" value={newTreatment.startDate || ''} onChange={(e) => setNewTreatment({ ...newTreatment, startDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Therapy Notes</label>
            <textarea value={newTreatment.notes || ''} onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" rows={2} />
          </div>
          <button onClick={handleAddTreatment} disabled={!newTreatment.name} className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-transform active:scale-95">Record Treatment</button>
        </div>
      </Modal>

      {/* 4. Medicine Modal */}
      <Modal isOpen={isMedicineModalOpen} onClose={() => setMedicineModalOpen(false)} title="Log Medication">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Medicine Name*</label>
            <input type="text" value={newMedicine.name || ''} onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="e.g. Lisinopril" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dosage</label>
              <input type="text" value={newMedicine.dosage || ''} onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="10mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
              <input type="text" value={newMedicine.frequency || ''} onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="Once daily" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prescriber</label>
              <input type="text" value={newMedicine.prescribedBy || ''} onChange={(e) => setNewMedicine({ ...newMedicine, prescribedBy: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="Dr. Adams" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prescribed On</label>
              <input type="date" value={newMedicine.startDate || ''} onChange={(e) => setNewMedicine({ ...newMedicine, startDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" />
            </div>
          </div>
          <button onClick={handleAddMedicine} disabled={!newMedicine.name} className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-transform active:scale-95">Add Medicine</button>
        </div>
      </Modal>

      {/* 5. Surgery Modal */}
      <Modal isOpen={isSurgeryModalOpen} onClose={() => setSurgeryModalOpen(false)} title="Log Surgical History">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Procedure Name*</label>
            <input type="text" value={newSurgery.name || ''} onChange={(e) => setNewSurgery({ ...newSurgery, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all" placeholder="e.g. Appendectomy" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Surgeon</label>
              <input type="text" value={newSurgery.surgeon || ''} onChange={(e) => setNewSurgery({ ...newSurgery, surgeon: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all" placeholder="Dr. Grey" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input type="date" value={newSurgery.date || ''} onChange={(e) => setNewSurgery({ ...newSurgery, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Facility/Hospital</label>
            <input type="text" value={newSurgery.hospital || ''} onChange={(e) => setNewSurgery({ ...newSurgery, hospital: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all" placeholder="County General" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Complications / Notes</label>
            <textarea value={newSurgery.notes || ''} onChange={(e) => setNewSurgery({ ...newSurgery, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/50 outline-none transition-all" rows={2} />
          </div>
          <button onClick={handleAddSurgery} disabled={!newSurgery.name} className="w-full py-3 mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-transform active:scale-95">Record Surgery</button>
        </div>
      </Modal>

    </div>
  );
}

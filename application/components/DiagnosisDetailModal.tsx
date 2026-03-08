'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Download, Building2, FileText, Loader2 } from 'lucide-react';

interface DiagnosisDetailModalProps {
  record: {
    _id: string;
    type: 'audio' | 'image';
    result: any;
    fileUrl: string;
    fileName: string;
    isEmergency: boolean;
    createdAt: string;
  };
  onClose: () => void;
}

export default function DiagnosisDetailModal({ record, onClose }: DiagnosisDetailModalProps) {
  const [isFindingHospitals, setIsFindingHospitals] = useState(false);
  const [hospitalsResult, setHospitalsResult] = useState<any>(null);
  const [isGeneratingEpcr, setIsGeneratingEpcr] = useState(false);
  const [epcrResult, setEpcrResult] = useState<any>(null);

  const handleFindHospitals = async () => {
    try {
      setIsFindingHospitals(true);
      const res = await fetch('/api/emergency/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.result.rawData || record.result),
      });
      const data = await res.json();
      setHospitalsResult(data);
    } catch (e) {
      console.error(e);
      alert('Failed to find hospitals');
    } finally {
      setIsFindingHospitals(false);
    }
  };

  const handleGenerateEpcr = async () => {
    try {
      setIsGeneratingEpcr(true);
      const res = await fetch('/api/emergency/epcr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.result.rawData || record.result),
      });
      const data = await res.json();
      setEpcrResult(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate ePCR');
    } finally {
      setIsGeneratingEpcr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-black/10 dark:border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Diagnosis Details</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Emergency Status */}
          <div className={`p-6 rounded-xl border-2 ${
            record.isEmergency
              ? 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20 dark:border-red-500/40'
              : 'bg-green-500/10 border-green-500/30 dark:bg-green-500/20 dark:border-green-500/40'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                record.isEmergency
                  ? 'bg-red-500/20 dark:bg-red-500/30'
                  : 'bg-green-500/20 dark:bg-green-500/30'
              }`}>
                {record.isEmergency ? (
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${
                  record.isEmergency
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  {record.isEmergency ? 'Emergency Detected' : 'No Emergency Detected'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 capitalize">
                  {record.type} Analysis
                </p>
              </div>
            </div>
          </div>

          {/* File Preview */}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4">Uploaded File</h4>
            {record.type === 'image' ? (
              <div className="space-y-4">
                <img
                  src={record.fileUrl}
                  alt="Diagnosis"
                  className="w-full max-h-96 object-contain rounded-lg bg-black/10 dark:bg-white/10"
                />
                <a
                  href={record.fileUrl}
                  download={record.fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={record.fileUrl} />
                  Your browser does not support the audio element.
                </audio>
                <a
                  href={record.fileUrl}
                  download={record.fileName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Audio
                </a>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4">Analysis Results</h4>
            
            {record.type === 'audio' && (
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Detected Emotion</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {record.result.emotion}
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Emergency Category</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {record.result.category}
                  </div>
                </div>
              </div>
            )}

            {record.type === 'image' && (
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {record.result.status}
                  </div>
                </div>
                {record.result.reason && (
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Reason</div>
                    <div className="text-base text-slate-900 dark:text-white">
                      {record.result.reason}
                    </div>
                  </div>
                )}
                {record.result.labels && record.result.labels.length > 0 && (
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Detected Labels</div>
                    <div className="flex flex-wrap gap-2">
                      {record.result.labels.map((label: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Raw Data */}
          <details className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
            <summary className="text-lg font-bold cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors">
              View Raw JSON Data
            </summary>
            <pre className="mt-4 p-4 bg-black/10 dark:bg-white/10 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(record.result.rawData || record.result, null, 2)}
            </pre>
          </details>

          {/* ML Tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Find Hospitals
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Use AI to identify the top 5 most suitable medical facilities for this specific emergency.
              </p>
              <button
                onClick={handleFindHospitals}
                disabled={isFindingHospitals}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFindingHospitals ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {isFindingHospitals ? 'Processing...' : 'Find Specific Hospitals'}
              </button>
              
              {hospitalsResult && (
                <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                  {hospitalsResult.hospital_list?.recommended_hospitals ? (
                    <div className="space-y-4">
                      {hospitalsResult.hospital_list.recommended_hospitals.map((h: any, i: number) => (
                        <div key={i} className="border-b border-black/10 dark:border-white/10 pb-3 last:border-0 last:pb-0">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{h.facility_name || h.category}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{h.priority_level}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{h.justification}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-xs overflow-x-auto">{JSON.stringify(hospitalsResult, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>

            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Generate ePCR
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Generate a comprehensive electronic Patient Care Record (ePCR) using AI analysis.
              </p>
              <button
                onClick={handleGenerateEpcr}
                disabled={isGeneratingEpcr}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingEpcr ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {isGeneratingEpcr ? 'Processing...' : 'Generate ePCR'}
              </button>
              
              {epcrResult && (
                <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(epcrResult.data || epcrResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

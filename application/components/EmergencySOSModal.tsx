'use client';

import { useState, useRef } from 'react';
import { X, Upload, Mic, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadType = 'audio' | 'image' | null;
type Step = 'select' | 'upload' | 'result';

interface DiagnosisResult {
  type: 'audio' | 'image';
  emotion?: string;
  category?: string;
  status?: string;
  reason?: string;
  labels?: string[];
  isEmergency: boolean;
  rawData?: any;
}

export default function EmergencySOSModal({ isOpen, onClose }: EmergencySOSModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep('select');
    setUploadType(null);
    setSelectedFile(null);
    setDiagnosisResult(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const handleTypeSelect = (type: 'audio' | 'image') => {
    setUploadType(type);
    setStep('upload');
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (uploadType === 'audio') {
      if (!file.type.startsWith('audio/')) {
        setError('Please select a valid audio file');
        return;
      }
    } else if (uploadType === 'image') {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadType);

      const response = await fetch('/api/emergency/diagnose', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process diagnosis');
      }

      setDiagnosisResult(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'An error occurred during diagnosis');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    if (step === 'upload') {
      setStep('select');
      setUploadType(null);
      setSelectedFile(null);
      setError(null);
    } else if (step === 'result') {
      setStep('upload');
      setDiagnosisResult(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-black/10 dark:border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {step !== 'select' && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Emergency SOS Diagnosis</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {step === 'select' && 'Choose diagnosis method'}
                {step === 'upload' && `Upload ${uploadType} file`}
                {step === 'result' && 'Diagnosis Results'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Type */}
          {step === 'select' && (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelect('audio')}
                className="group p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 border-2 border-blue-500/30 dark:border-blue-500/40 rounded-xl hover:border-blue-500/60 dark:hover:border-blue-500/70 transition-all hover:scale-[1.02]"
              >
                <div className="w-16 h-16 bg-blue-500/20 dark:bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Audio Diagnosis</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload voice recording for emotion and emergency detection
                </p>
              </button>

              <button
                onClick={() => handleTypeSelect('image')}
                className="group p-8 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 border-2 border-purple-500/30 dark:border-purple-500/40 rounded-xl hover:border-purple-500/60 dark:hover:border-purple-500/70 transition-all hover:scale-[1.02]"
              >
                <div className="w-16 h-16 bg-purple-500/20 dark:bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Image Diagnosis</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload image for visual emergency assessment
                </p>
              </button>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl p-12 text-center hover:border-black/40 dark:hover:border-white/40 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="w-20 h-20 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {selectedFile ? selectedFile.name : `Click to upload ${uploadType} file`}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {uploadType === 'audio' ? 'Supported: MP3, WAV, M4A' : 'Supported: JPG, PNG, WEBP'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={uploadType === 'audio' ? 'audio/*' : 'image/*'}
                capture={uploadType === 'image' ? 'environment' : undefined}
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-400 disabled:to-red-500 rounded-xl font-semibold transition-all text-white flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Analyze Emergency</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'result' && diagnosisResult && (
            <div className="space-y-6">
              {/* Emergency Status */}
              <div className={`p-6 rounded-xl border-2 ${
                diagnosisResult.isEmergency
                  ? 'bg-red-500/10 border-red-500/30 dark:bg-red-500/20 dark:border-red-500/40'
                  : 'bg-green-500/10 border-green-500/30 dark:bg-green-500/20 dark:border-green-500/40'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    diagnosisResult.isEmergency
                      ? 'bg-red-500/20 dark:bg-red-500/30'
                      : 'bg-green-500/20 dark:bg-green-500/30'
                  }`}>
                    {diagnosisResult.isEmergency ? (
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${
                      diagnosisResult.isEmergency
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {diagnosisResult.isEmergency ? 'Emergency Detected' : 'No Emergency Detected'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Analysis completed successfully
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Results */}
              {diagnosisResult.type === 'audio' && (
                <div className="space-y-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Detected Emotion</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{diagnosisResult.emotion}</div>
                  </div>
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Emergency Category</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">{diagnosisResult.category}</div>
                  </div>
                </div>
              )}

              {/* Image Results */}
              {diagnosisResult.type === 'image' && (
                <div className="space-y-4">
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">{diagnosisResult.status}</div>
                  </div>
                  {diagnosisResult.reason && (
                    <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Reason</div>
                      <div className="text-base text-slate-900 dark:text-white">{diagnosisResult.reason}</div>
                    </div>
                  )}
                  {diagnosisResult.labels && diagnosisResult.labels.length > 0 && (
                    <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Detected Labels</div>
                      <div className="flex flex-wrap gap-2">
                        {diagnosisResult.labels.map((label, index) => (
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('select');
                    setUploadType(null);
                    setSelectedFile(null);
                    setDiagnosisResult(null);
                  }}
                  className="flex-1 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg font-medium transition-all text-slate-800 dark:text-white"
                >
                  New Diagnosis
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Mic, Image as ImageIcon, Eye, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import DiagnosisDetailModal from './DiagnosisDetailModal';

interface DiagnosisRecord {
  _id: string;
  type: 'audio' | 'image';
  result: any;
  fileUrl: string;
  fileName: string;
  isEmergency: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 8;

export default function DiagnosisHistoryClient() {
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/diagnosis-history');
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diagnosis record?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/diagnosis-history?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(history.filter(record => record._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record');
    } finally {
      setDeleting(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRecords = history.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-8 sm:p-12 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold mb-2">No Diagnosis History</h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400">
          You haven't performed any emergency diagnoses yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {currentRecords.map((record) => (
          <div
            key={record._id}
            className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Image/Audio Preview - Left Side */}
              <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-black/5 dark:bg-white/5 relative">
                {record.type === 'image' ? (
                  <img
                    src={record.fileUrl}
                    alt="Diagnosis"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">Audio File</p>
                    </div>
                  </div>
                )}
                
                {/* Emergency Badge Overlay */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    record.isEmergency
                      ? 'bg-red-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}>
                    {record.isEmergency ? 'EMERGENCY' : 'SAFE'}
                  </span>
                </div>
              </div>

              {/* Details - Right Side */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {record.type === 'audio' ? (
                        <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                      <span className="text-xs font-medium text-slate-600 dark:text-gray-400 uppercase">
                        {record.type} Diagnosis
                      </span>
                    </div>
                    
                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${
                      record.isEmergency
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-green-700 dark:text-green-400'
                    }`}>
                      {record.isEmergency ? 'Emergency Detected' : 'No Emergency'}
                    </h3>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(record.createdAt).toLocaleTimeString()}</span>
                </div>

                {/* Quick Info */}
                <div className="mb-4">
                  {record.type === 'audio' && (
                    <div className="text-sm text-slate-700 dark:text-gray-300">
                      <span className="font-semibold">Emotion:</span> {record.result.emotion || 'N/A'}
                      <span className="mx-2">•</span>
                      <span className="font-semibold">Category:</span> {record.result.category || 'N/A'}
                    </div>
                  )}
                  {record.type === 'image' && (
                    <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-2">
                      {record.result.reason || 'Analysis complete'}
                    </p>
                  )}
                </div>

                {/* Labels for Image */}
                {record.type === 'image' && record.result.labels && record.result.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {record.result.labels.slice(0, 4).map((label: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-xs font-medium"
                      >
                        {label}
                      </span>
                    ))}
                    {record.result.labels.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-500/10 text-slate-700 dark:text-slate-400 rounded text-xs font-medium">
                        +{record.result.labels.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Report</span>
                  </button>
                  <button
                    onClick={() => handleDelete(record._id)}
                    disabled={deleting === record._id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {deleting === record._id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-gray-400">
              Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all text-sm font-medium"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedRecord && (
        <DiagnosisDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </>
  );
}

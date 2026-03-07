'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import EmergencySOSModal from './EmergencySOSModal';

export default function EmergencySOSButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 text-white flex items-center justify-center gap-3 text-lg animate-pulse hover:animate-none"
      >
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <span>Emergency SOS Diagnosis</span>
      </button>

      <EmergencySOSModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

type Scripts = {
  ambulance_audio_script?: { language?: string; transcript?: string };
  doctor_audio_script?: { language?: string; transcript?: string };
  bystander_audio_script?: { language?: string; transcript?: string };
};

type ScriptKey = 'bystander' | 'ambulance' | 'doctor';

export default function MapPage() {
  useEffect(() => {
    // Fix default marker icons in Next.js (asset path issues).
    // This runs only in the browser.
    void import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proto = (L.Icon.Default.prototype as any);
      if (proto && proto._getIconUrl) {
        delete proto._getIconUrl;
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const defaultPayload = useMemo(
    () => ({
      patient_info: { name: 'Patient', age: 50, gender: 'Male' },
      current_incident: {
        chief_complaint: 'Unconscious after blunt force trauma to the head in a traffic accident.',
        vitals: { bp: '90/60', heart_rate: 130, spo2: 88 },
        severity: 'Critical',
      },
      medical_history: {
        known_conditions: [],
        allergies: [],
      },
      logistics: {
        incident_location: 'Bypass Road, near zero mile',
        ambulance_current_location: 'Kankarbagh Station',
        region: 'Patna, Bihar',
        preferred_local_language: 'Hindi',
      },
    }),
    []
  );

  const [activeScript, setActiveScript] = useState<ScriptKey>('bystander');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Scripts | null>(null);

  const generate = async () => {
    setError(null);
    setScripts(null);

    try {
      setIsLoading(true);
      const res = await fetch('/api/emergency/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to generate transcript');
        return;
      }

      const scriptsData: Scripts = data?.data ?? data;
      setScripts(scriptsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  const activeTranscript =
    activeScript === 'ambulance'
      ? scripts?.ambulance_audio_script?.transcript
      : activeScript === 'doctor'
        ? scripts?.doctor_audio_script?.transcript
        : scripts?.bystander_audio_script?.transcript;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Emergency Map</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Dummy map preview with scripts (Ambulance / Doctor / Bystander).
          </p>
        </div>

        <div className="bg-white/80 dark:bg-transparent dark:bg-linear-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 rounded-xl p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Map
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Click Generate to fetch scripts from <span className="font-mono">/api/emergency/transcript</span>.
              </div>
            </div>

            <button
              onClick={generate}
              disabled={isLoading}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl font-semibold transition-all text-white"
            >
              {isLoading ? 'Generating…' : 'Generate Scripts'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="relative overflow-hidden rounded-xl border border-black/10 dark:border-white/10 h-[520px]">
            <MapContainer
              center={[25.611, 85.144]}
              zoom={12}
              scrollWheelZoom
              className="h-full w-full"
              // whenReady={(e) => {
              //   // Leaflet sometimes needs a size invalidation after mount.
              //   setTimeout(() => e.target.invalidateSize(), 0);
              // }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={[25.613, 85.135]}>
                <Popup>
                  Ambulance
                  <br />
                  Phone: not available
                </Popup>
              </Marker>
              <Marker position={[25.616, 85.152]}>
                <Popup>Doctor</Popup>
              </Marker>
              <Marker position={[25.604, 85.141]}>
                <Popup>Bystander</Popup>
              </Marker>
              <Marker position={[25.6205, 85.168]}>
                <Popup>Hospital</Popup>
              </Marker>
            </MapContainer>

            <div className="pointer-events-none absolute top-3 left-3 text-xs font-semibold rounded-lg px-3 py-2 bg-white/80 dark:bg-black/30 border border-black/10 dark:border-white/10">
              Leaflet Map Preview
            </div>

            <div className="pointer-events-none absolute top-[18%] left-[14%]">
              <div className="px-3 py-2 rounded-xl bg-emerald-600/90 text-white text-xs font-semibold border border-black/10">
                Ambulance
              </div>
            </div>

            <div className="pointer-events-none absolute top-[30%] left-[58%]">
              <div className="px-3 py-2 rounded-xl bg-violet-600/90 text-white text-xs font-semibold border border-black/10">
                Doctor
              </div>
            </div>

            <div className="pointer-events-none absolute top-[60%] left-[30%]">
              <div className="px-3 py-2 rounded-xl bg-amber-600/90 text-white text-xs font-semibold border border-black/10">
                Bystander
              </div>
            </div>

            <div className="pointer-events-none absolute top-[42%] left-[78%]">
              <div className="px-3 py-2 rounded-xl bg-blue-600/90 text-white text-xs font-semibold border border-black/10">
                Hospital
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0">
              <div className="bg-white/95 dark:bg-black/50 border-t border-black/10 dark:border-white/10 backdrop-blur-sm">
                <div className="flex gap-2 p-3">
                  {(
                    [
                      ['bystander', 'Bystander'],
                      ['ambulance', 'Ambulance'],
                      ['doctor', 'Doctor'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveScript(key)}
                      className={
                        'px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ' +
                        (activeScript === key
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                          : 'bg-transparent text-slate-700 dark:text-slate-200 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10')
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Script
                  </div>
                  <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {activeTranscript || (scripts ? 'No script returned' : 'Generate scripts to see output here.')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Needs env var <span className="font-mono">ML_GENERATE_TRANSCRIPT_URL</span> set in your Next.js environment to point to
          your ML server (example: <span className="font-mono">http://127.0.0.1:5000/generate-transcript</span>).
        </div>
      </div>
    </div>
  );
}

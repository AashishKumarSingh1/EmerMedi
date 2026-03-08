'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
  X, Upload, Mic, Image as ImageIcon,
  AlertCircle, CheckCircle, Loader2,
  Phone, Flame, Shield, Clock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadType = 'audio' | 'image' | null;
type Step = 'select' | 'upload' | 'result';

interface ImageTriageResult {
  emergency_level: 'critical' | 'urgent' | 'moderate' | 'low' | 'none';
  urgency_score: number;
  call_ambulance: boolean;
  call_police: boolean;
  call_fire_department: boolean;
  time_critical: boolean;
  scene_type: string;
  scene_description: string;
  patient_status: {
    estimated_victims: number;
    consciousness_level: string;
    breathing_status: string;
    injury_severity: string;
  };
  detected_injuries: Array<{
    type: string;
    body_location: string;
    severity: string;
    visible_signs: string;
  }>;
  medical_flags: Record<string, boolean>;
  environmental_hazards: Record<string, boolean>;
  immediate_actions: string[];
  do_not_actions: string[];
  first_aid_steps: string[];
  dispatcher_report: string;
  hospital_recommendation: string;
  eta_urgency: string;
  confidence_score: number;
  reasoning: string;
  rekognition: {
    labels: string[];
    labels_detail?: Array<{ name: string; confidence: number }>;
    faces_count: number;
    moderation_flags: Array<{ name: string; confidence: number }>;
    detected_text: string[];
  };
}

interface DiagnosisResult {
  type: 'audio' | 'image';
  emotion?: string;
  category?: string;
  triage?: ImageTriageResult;
  isEmergency: boolean;
  rawData?: unknown;
}

type Coordinates = { latitude: number; longitude: number };

const LeafletMapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const LeafletTileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const LeafletMarker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const LeafletPopup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

type RecommendedHospital = {
  facility_name?: string;
  address?: string;
  location?: { lat?: number; lng?: number };
  latitude?: number;
  longitude?: number;
  phone?: string;
  phone_number?: string;
  formatted_phone_number?: string;
};

function HospitalsLeafletMap({
  origin,
  hospitals,
}: {
  origin: Coordinates | null;
  hospitals: RecommendedHospital[];
}) {
  useEffect(() => {
    void import('leaflet').then((L) => {
      // Fix default marker icons in Next.js.
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

  const markers = useMemo(() => {
    const out: Array<{
      key: string;
      label: string;
      lat: number;
      lng: number;
      address?: string;
      phone?: string;
      kind: 'origin' | 'hospital';
    }> = [];

    if (origin) {
      out.push({
        key: 'origin',
        label: 'You (Current Location)',
        lat: origin.latitude,
        lng: origin.longitude,
        kind: 'origin',
      });
    }

    hospitals.forEach((h, idx) => {
      const lat = typeof h.location?.lat === 'number' ? h.location.lat : typeof h.latitude === 'number' ? h.latitude : null;
      const lng = typeof h.location?.lng === 'number' ? h.location.lng : typeof h.longitude === 'number' ? h.longitude : null;
      if (lat === null || lng === null) return;

      const phone = h.phone || h.formatted_phone_number || h.phone_number;
      out.push({
        key: `h-${idx}-${h.facility_name ?? 'hospital'}`,
        label: h.facility_name ?? `Hospital ${idx + 1}`,
        lat,
        lng,
        address: h.address,
        phone: phone || undefined,
        kind: 'hospital',
      });
    });

    return out;
  }, [hospitals, origin]);

  const center: [number, number] = origin
    ? [origin.latitude, origin.longitude]
    : markers.length > 0
      ? [markers[0].lat, markers[0].lng]
      : [25.611, 85.144];

  return (
    <div className="h-full w-full">
      <LeafletMapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        whenReady={(e) => {
          setTimeout(() => e.target.invalidateSize(), 0);
        }}
      >
        <LeafletTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((m) => (
          <LeafletMarker key={m.key} position={[m.lat, m.lng]}>
            <LeafletPopup>
              <div className="text-sm font-semibold">{m.label}</div>
              {m.address && <div className="text-xs opacity-80 mt-1">{m.address}</div>}
              {m.phone && (
                <a
                  className="inline-block mt-2 text-sm font-semibold text-blue-700 hover:underline"
                  href={`tel:${m.phone}`}
                >
                  Call {m.phone}
                </a>
              )}
            </LeafletPopup>
          </LeafletMarker>
        ))}
      </LeafletMapContainer>
    </div>
  );
}

function getCurrentCoordinates(): Promise<Coordinates | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!('geolocation' in navigator)) return Promise.resolve(null);

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
    );
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, {
  bg: string; border: string; bar: string;
  badge: string; text: string; ringText: string; label: string;
}> = {
  critical: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-500/50',
    bar: 'bg-red-600',
    badge: 'bg-red-600 text-white',
    text: 'text-red-700 dark:text-red-400',
    ringText: 'text-red-600 dark:text-red-400',
    label: 'CRITICAL',
  },
  urgent: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-500/50',
    bar: 'bg-orange-500',
    badge: 'bg-orange-500 text-white',
    text: 'text-orange-700 dark:text-orange-400',
    ringText: 'text-orange-600 dark:text-orange-400',
    label: 'URGENT',
  },
  moderate: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    border: 'border-yellow-500/50',
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-500 text-white',
    text: 'text-yellow-700 dark:text-yellow-500',
    ringText: 'text-yellow-600 dark:text-yellow-500',
    label: 'MODERATE',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-500/50',
    bar: 'bg-blue-500',
    badge: 'bg-blue-500 text-white',
    text: 'text-blue-700 dark:text-blue-400',
    ringText: 'text-blue-600 dark:text-blue-400',
    label: 'LOW',
  },
  none: {
    bg: 'bg-green-50 dark:bg-green-950/40',
    border: 'border-green-500/50',
    bar: 'bg-green-600',
    badge: 'bg-green-600 text-white',
    text: 'text-green-700 dark:text-green-400',
    ringText: 'text-green-600 dark:text-green-400',
    label: 'ALL CLEAR',
  },
};

const ETA_CFG: Record<string, { label: string; cls: string }> = {
  immediate_108:  { label: '🚨 Call 108 Immediately', cls: 'bg-red-600 text-white' },
  within_minutes: { label: '⚡ Urgent — Within Minutes', cls: 'bg-orange-500 text-white' },
  within_hour:    { label: '⏱️ Within the Hour', cls: 'bg-yellow-500 text-white' },
  non_urgent:     { label: '✓ Non-Urgent', cls: 'bg-green-600 text-white' },
};

const EMOTION_INFO: Record<string, { emoji: string; clinical: string; actions: string[] }> = {
  fearful: {
    emoji: '😨',
    clinical: 'Fear response detected — the person may be in danger, experiencing panic, or facing a threatening situation.',
    actions: [
      "Ask: 'Are you safe right now?'",
      'Listen for background sounds — they can provide location clues',
      'Stay on the line — do NOT hang up',
      'Contact emergency services if location is known',
    ],
  },
  angry: {
    emoji: '😡',
    clinical: 'Agitation detected — possible confrontation, severe pain response, or emotional crisis.',
    actions: [
      'Stay calm and speak slowly and clearly',
      'Ask for their current location',
      'Contact police if physical violence is suspected',
    ],
  },
  surprised: {
    emoji: '😲',
    clinical: 'Shock / surprise response — possible sudden accident, injury, or unexpected trauma.',
    actions: [
      'Ask if they need immediate help',
      'Request current location and a description of the scene',
      'Dispatch ambulance if physical injury is suspected',
    ],
  },
  sad: {
    emoji: '😢',
    clinical: 'Emotional distress detected — possible psychological crisis, pain, or physical injury.',
    actions: [
      'Express concern and ask what happened',
      'Keep them talking — assess for self-harm risk if appropriate',
      'Stay present; do not rush or dismiss their distress',
    ],
  },
  disgust: {
    emoji: '😖',
    clinical: 'Discomfort / aversion in voice — possible physical illness, nausea, or toxic exposure.',
    actions: [
      'Ask what is wrong and if they feel sick',
      'Inquire about any pain, vomiting, or recent ingestion',
      'Consider toxic or chemical exposure if context warrants',
    ],
  },
  neutral: {
    emoji: '😐',
    clinical: 'Neutral vocal pattern — no acute emotional distress detected at this time.',
    actions: ['Ask if everything is alright', 'Monitor the situation closely'],
  },
  calm: {
    emoji: '😌',
    clinical: 'Calm vocal pattern — no stress indicators present in the voice.',
    actions: ['Confirm everything is okay', 'Ask if any assistance is required'],
  },
  happy: {
    emoji: '😊',
    clinical: 'Positive vocal tone detected — no signs of distress or emergency in this recording.',
    actions: [],
  },
};

const SEVERITY_CLS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-700 dark:text-red-400',
  serious:  'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  moderate: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500',
  minor:    'bg-blue-500/20 text-blue-700 dark:text-blue-400',
};

const fmt = (s: string) => (s || '').replace(/_/g, ' ');

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHead({ label }: { label: string }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
      {label}
    </div>
  );
}

// ─── Audio Result View ────────────────────────────────────────────────────────

function AudioResultView({ result }: { result: DiagnosisResult }) {
  const emotion = (result.emotion || 'neutral').toLowerCase();
  const isEmergency = result.isEmergency;
  const info = EMOTION_INFO[emotion] ?? EMOTION_INFO.neutral;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`p-5 rounded-xl border-2 ${
        isEmergency
          ? 'bg-red-50 dark:bg-red-950/40 border-red-500/50'
          : 'bg-green-50 dark:bg-green-950/40 border-green-500/50'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl select-none ${
            isEmergency ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'
          }`}>
            {info.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-1.5 ${
              isEmergency ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {result.category ?? (isEmergency ? 'Emergency' : 'Non-Emergency')}
            </span>
            <div className={`text-2xl font-bold capitalize ${
              isEmergency ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
            }`}>
              {emotion}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Detected Voice Emotion</div>
          </div>
        </div>
      </div>

      {/* Clinical interpretation */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-black/10 dark:border-white/10">
        <SectionHead label="Clinical Interpretation" />
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{info.clinical}</p>
      </div>

      {/* Recommended actions */}
      {info.actions.length > 0 && (
        <div>
          <SectionHead label="Recommended Actions" />
          <div className="space-y-1.5">
            {info.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-green-500/5 border border-green-500/25 dark:bg-green-500/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-800 dark:text-slate-200">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency numbers */}
      {isEmergency && (
        <div className="flex items-center gap-3 p-4 bg-red-600 dark:bg-red-700 rounded-xl">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Emergency Services</div>
            <div className="text-red-100 text-xs mt-0.5">
              108 (US) · 112 (EU/IN) · 999 (UK) · 102 (Ambulance IN)
            </div>
          </div>
        </div>
      )}

      {/* Raw data pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Emotion Detected</div>
          <div className="font-bold text-slate-900 dark:text-white capitalize">{emotion}</div>
        </div>
        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Emergency Category</div>
          <div className={`font-bold capitalize ${isEmergency ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {result.category}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Triage View ────────────────────────────────────────────────────────

function ImageTriageView({ triage }: { triage: ImageTriageResult }) {
  const [copied, setCopied] = useState(false);
  const [hospitals, setHospitals] = useState<any>(null);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (triage.hospital_recommendation && triage.hospital_recommendation.toLowerCase() !== 'none') {
      const fetchHospitals = async () => {
        try {
          setIsFetchingHospitals(true);
          const coords = await getCurrentCoordinates();
          setOriginCoords(coords);
          const res = await fetch('/api/emergency/hospitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...triage,
              logistics: {
                coordinates: coords,
              },
            }),
          });
          const data = await res.json();
          setHospitals(data);
        } catch (e) {
          console.error('Failed to fetch hospitals:', e);
        } finally {
          setIsFetchingHospitals(false);
        }
      };
      
      fetchHospitals();
    }
  }, [triage]);

  const copyReport = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const cfg = LEVEL_CFG[triage.emergency_level] ?? LEVEL_CFG.none;
  const etaCfg = ETA_CFG[triage.eta_urgency] ?? ETA_CFG.non_urgent;
  const isFallback = (triage.confidence_score ?? 1) < 0.6;
  const activeFlags = Object.entries(triage.medical_flags ?? {}).filter(([, v]) => v).map(([k]) => fmt(k));
  const activeHazards = Object.entries(triage.environmental_hazards ?? {}).filter(([, v]) => v).map(([k]) => fmt(k));
  const hasRealSceneDesc = triage.scene_description && !triage.scene_description.toLowerCase().startsWith('fallback');
  const needsDispatch = triage.call_ambulance || triage.call_police || triage.call_fire_department;

  return (
    <div className="space-y-4">

      {/* Fallback warning */}
      {isFallback && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-400/50 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Preliminary assessment only</span> — AI enhanced analysis was unavailable. Results are based on keyword detection from image labels.
          </div>
        </div>
      )}

      {/* Level + Score banner */}
      <div className={`p-5 rounded-xl border-2 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
          <div className="flex items-center gap-2">
            {triage.time_critical && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-100 dark:bg-red-900/40 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> TIME CRITICAL
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${etaCfg.cls}`}>
              {etaCfg.label}
            </span>
          </div>
        </div>

        {/* Urgency bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Urgency Score</span>
            <span className={`text-2xl font-black tabular-nums ${cfg.ringText}`}>{triage.urgency_score}<span className="text-sm font-semibold text-slate-400">/100</span></span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full ${cfg.bar} transition-all duration-700`}
              style={{ width: `${triage.urgency_score}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{triage.reasoning}</p>
      </div>

      {/* Dispatch */}
      {needsDispatch && (
        <div>
          <SectionHead label="Dispatch Required" />
          <div className={`grid gap-2 ${[triage.call_ambulance, triage.call_police, triage.call_fire_department].filter(Boolean).length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {triage.call_ambulance && (
              <div className="flex items-center gap-3 p-4 bg-red-600 dark:bg-red-700 rounded-xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Ambulance</div>
                  <div className="text-red-100 text-xs">108 · 102</div>
                </div>
              </div>
            )}
            {triage.call_police && (
              <div className="flex items-center gap-3 p-4 bg-blue-600 dark:bg-blue-700 rounded-xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Police</div>
                  <div className="text-blue-100 text-xs">108 · 100</div>
                </div>
              </div>
            )}
            {triage.call_fire_department && (
              <div className="flex items-center gap-3 p-4 bg-orange-500 dark:bg-orange-600 rounded-xl">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Fire Dept</div>
                  <div className="text-orange-100 text-xs">108 · 101</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scene & Patient */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionHead label="Scene Type" />
            <div className="font-semibold text-slate-900 dark:text-white capitalize">{fmt(triage.scene_type)}</div>
          </div>
          <div className="text-right">
            <SectionHead label="Hospital" />
            <div className="font-semibold text-slate-900 dark:text-white capitalize">{fmt(triage.hospital_recommendation)}</div>
          </div>
        </div>

        {hasRealSceneDesc && (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-black/10 dark:border-white/10 pt-3">
            {triage.scene_description}
          </p>
        )}

        {triage.patient_status && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-black/10 dark:border-white/10 pt-3">
            {[
              ['Victims', String(triage.patient_status.estimated_victims)],
              ['Injury Severity', fmt(triage.patient_status.injury_severity)],
              ['Consciousness', fmt(triage.patient_status.consciousness_level)],
              ['Breathing', fmt(triage.patient_status.breathing_status)],
            ].map(([label, val]) => (
              <div key={label}>
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}: </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{val}</span>
              </div>
            ))}
          </div>
        )}

        {isFetchingHospitals && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/10 dark:border-white/10 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is finding the best nearby facilities for these exact injuries...
          </div>
        )}

        {hospitals?.hospital_list?.recommended_hospitals && (
          <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
            <SectionHead label="Recommended Facilities (AI Found)" />

            <div className="h-[260px] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60">
              <HospitalsLeafletMap origin={originCoords} hospitals={hospitals.hospital_list.recommended_hospitals} />
            </div>

            {hospitals.hospital_list.recommended_hospitals.slice(0, 3).map((h: any, i: number) => (
              <div key={i} className="flex justify-between items-start gap-4 p-2.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white capitalize text-sm">{h.facility_name || h.category}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{h.justification}</div>
                  {h.location?.lat && h.location?.lng && (
                    <a
                      className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      href={`https://www.google.com/maps/search/?api=1&query=${h.location.lat},${h.location.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full whitespace-nowrap">
                  {h.priority_level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical flags + hazards */}
      {(activeFlags.length > 0 || activeHazards.length > 0) && (
        <div className="space-y-3">
          {activeFlags.length > 0 && (
            <div>
              <SectionHead label="Active Medical Flags" />
              <div className="flex flex-wrap gap-1.5">
                {activeFlags.map((f, i) => (
                  <span key={i} className="px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold capitalize">{f}</span>
                ))}
              </div>
            </div>
          )}
          {activeHazards.length > 0 && (
            <div>
              <SectionHead label="Environmental Hazards" />
              <div className="flex flex-wrap gap-1.5">
                {activeHazards.map((h, i) => (
                  <span key={i} className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold capitalize">{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detected Injuries */}
      {triage.detected_injuries?.length > 0 && (
        <div>
          <SectionHead label={`Detected Injuries (${triage.detected_injuries.length})`} />
          <div className="space-y-2">
            {triage.detected_injuries.map((inj, i) => (
              <div key={i} className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm capitalize">{inj.type}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${SEVERITY_CLS[inj.severity] ?? SEVERITY_CLS.minor}`}>
                    {inj.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-medium capitalize">{inj.body_location}</span>
                  {inj.visible_signs ? ` — ${inj.visible_signs}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Actions */}
      {triage.immediate_actions?.length > 0 && (
        <div>
          <SectionHead label="Immediate Actions" />
          <div className="space-y-1.5">
            {triage.immediate_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-800 dark:text-slate-200">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Do NOT */}
      {triage.do_not_actions?.length > 0 && (
        <div>
          <SectionHead label="Do NOT" />
          <div className="space-y-1.5">
            {triage.do_not_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-800 dark:text-slate-200">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* First Aid Steps */}
      {triage.first_aid_steps?.length > 0 && (
        <div>
          <SectionHead label="First Aid Steps" />
          <div className="space-y-1.5">
            {triage.first_aid_steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-black/10 dark:border-white/10 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatcher Script */}
      {triage.dispatcher_report && !triage.dispatcher_report.toLowerCase().startsWith('critical keyword') && !triage.dispatcher_report.toLowerCase().startsWith('urgent keyword') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionHead label="108 Dispatcher Script" />
            <button
              onClick={() => copyReport(triage.dispatcher_report)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed border border-black/10 dark:border-white/10 whitespace-pre-wrap">
            {triage.dispatcher_report}
          </div>
        </div>
      )}

      {/* Rekognition labels */}
      {triage.rekognition?.labels?.length > 0 && (
        <div>
          <SectionHead label={`Scene Labels${triage.rekognition.faces_count > 0 ? ` · ${triage.rekognition.faces_count} face(s) detected` : ''}`} />
          <div className="flex flex-wrap gap-1.5 mb-2">
            {triage.rekognition.labels_detail
              ? triage.rekognition.labels_detail.map((l, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                    {l.name} <span className="opacity-60">{l.confidence.toFixed(0)}%</span>
                  </span>
                ))
              : triage.rekognition.labels.map((label, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                    {label}
                  </span>
                ))
            }
          </div>
          {triage.rekognition.detected_text?.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Text detected:</span> {triage.rekognition.detected_text.slice(0, 6).join(' · ')}
              {triage.rekognition.detected_text.length > 6 && ` +${triage.rekognition.detected_text.length - 6} more`}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>ETA: <span className="font-medium capitalize">{fmt(triage.eta_urgency)}</span></span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Confidence: <span className="font-semibold">{Math.round((triage.confidence_score ?? 0) * 100)}%</span>
          {isFallback && <span className="ml-1 text-amber-500">· Fallback mode</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function EmergencySOSModal({ isOpen, onClose }: EmergencySOSModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultKey, setResultKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetState = () => {
    // Stop and clean up media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping media recorder:', e);
      }
    }
    mediaRecorderRef.current = null;
    
    // Clear recording interval
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset all state
    setStep('select');
    setUploadType(null);
    setSelectedFile(null);
    setDiagnosisResult(null);
    setError(null);
    setIsUploading(false);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
    
    // Cleanup on unmount
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const handleTypeSelect = (type: 'audio' | 'image') => {
    setUploadType(type);
    setStep('upload');
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadType === 'audio' && !file.type.startsWith('audio/')) { setError('Please select a valid audio file'); return; }
    if (uploadType === 'image' && !file.type.startsWith('image/')) { setError('Please select a valid image file'); return; }
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
      const res = await fetch('/api/emergency/diagnose', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process diagnosis');
      setDiagnosisResult(data);
      setResultKey(k => k + 1);
      setStep('result');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    // Clean up any active streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
      }
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    if (step === 'upload') {
      setStep('select');
      setUploadType(null);
      setSelectedFile(null);
      setError(null);
      setIsRecording(false);
      setRecordingTime(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else if (step === 'result') {
      setStep('upload');
      setDiagnosisResult(null);
      setError(null);
    }
  };

  const handleNewDiagnosis = () => {
    resetState();
    setResultKey(k => k + 1);
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert WebM to WAV in browser
        try {
          const wavBlob = await convertToWav(audioBlob);
          const audioFile = new File([wavBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
          setSelectedFile(audioFile);
        } catch (err) {
          console.error('WAV conversion failed, using original:', err);
          const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          setSelectedFile(audioFile);
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const convertToWav = async (blob: Blob): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to WAV format
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length minus RIFF identifier length and file description length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(buffer.numberOfChannels);
    // sample rate
    setUint32(buffer.sampleRate);
    // byte rate (sample rate * block align)
    setUint32(buffer.sampleRate * buffer.numberOfChannels * 2);
    // block align (channel count * bytes per sample)
    setUint16(buffer.numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setSelectedFile(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-black/10 dark:border-white/10">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${step === 'select' ? 'invisible' : ''}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency SOS Diagnosis</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {step === 'select' && 'Choose diagnosis method'}
                {step === 'upload' && `Upload ${uploadType} file for analysis`}
                {step === 'result' && (diagnosisResult?.type === 'image' ? 'Visual Triage Report' : 'Voice Emergency Assessment')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">

          {/* Step 1 — Select type */}
          {step === 'select' && (
          <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => handleTypeSelect('audio')}
                className="group p-8 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 border-2 border-blue-500/30 dark:border-blue-500/40 rounded-xl hover:border-blue-500/70 transition-all hover:scale-[1.02] text-left">
                <div className="w-16 h-16 bg-blue-500/20 dark:bg-blue-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Audio Diagnosis</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Voice emotion analysis for emergency detection</p>
              </button>

              <button onClick={() => handleTypeSelect('image')}
                className="group p-8 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 border-2 border-purple-500/30 dark:border-purple-500/40 rounded-xl hover:border-purple-500/70 transition-all hover:scale-[1.02] text-left">
                <div className="w-16 h-16 bg-purple-500/20 dark:bg-purple-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Image Diagnosis</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Visual scene triage with AI + Rekognition</p>
              </button>
            </div>
          )}

          {/* Step 2 — Upload */}
          {step === 'upload' && (
          <div className="space-y-5">
              {/* Audio Recording Option */}
              {uploadType === 'audio' && !selectedFile && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={isRecording ? stopAudioRecording : startAudioRecording}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        isRecording
                          ? 'bg-red-500/10 border-red-500/50 hover:bg-red-500/20'
                          : 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-blue-500/20'
                      }`}>
                        <Mic className={`w-8 h-8 ${isRecording ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <p className="text-sm font-semibold text-center">
                        {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Record Audio'}
                      </p>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-xl border-2 bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm font-semibold text-center">Upload File</p>
                    </button>
                  </div>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Record your voice or upload an audio file (MP3, WAV, M4A, OGG)
                  </p>
                </div>
              )}

              {/* Image Capture Option */}
              {uploadType === 'image' && !selectedFile && !streamRef.current && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={startCamera}
                      className="p-6 rounded-xl border-2 bg-green-500/10 border-green-500/30 hover:border-green-500/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-center">Capture Photo</p>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-xl border-2 bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50 transition-all"
                    >
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-sm font-semibold text-center">Upload File</p>
                    </button>
                  </div>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Take a photo or upload an image file (JPG, PNG, WEBP, GIF)
                  </p>
                </div>
              )}

              {/* Camera View */}
              {uploadType === 'image' && streamRef.current && !selectedFile && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-all text-white flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-5 h-5" />
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-xl font-semibold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* File Preview */}
              {selectedFile && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-green-500/50 rounded-xl p-8 text-center bg-green-500/5">
                    <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-6 py-3 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-xl font-semibold transition-all text-sm"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-60 rounded-xl font-bold tracking-wide transition-all text-white flex items-center justify-center gap-3 disabled:cursor-not-allowed text-sm uppercase"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          <span>Run Emergency Analysis</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file"
                accept={uploadType === 'audio' ? 'audio/*' : 'image/*'}
                onChange={handleFileSelect} className="hidden" />

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Results */}
          {step === 'result' && diagnosisResult && (
            <div className="space-y-4">
              {diagnosisResult.type === 'audio' && (
                <AudioResultView key={resultKey} result={diagnosisResult} />
              )}
              {diagnosisResult.type === 'image' && diagnosisResult.triage && (
                <ImageTriageView key={resultKey} triage={diagnosisResult.triage} />
              )}

              <div className="flex gap-3 pt-2 border-t border-black/10 dark:border-white/10">
                <button onClick={handleNewDiagnosis}
                  className="flex-1 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl font-semibold transition-all text-slate-800 dark:text-white text-sm">
                  New Diagnosis
                </button>
                <button onClick={onClose}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all text-white text-sm">
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

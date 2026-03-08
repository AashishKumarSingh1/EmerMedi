import Link from "next/link";

type AmbulanceStatus = "Responding" | "On Scene" | "Transporting" | "Handover";

type AmbulanceRun = {
  runId: string;
  status: AmbulanceStatus;
  etaToHospitalMinutes: number;
  unit: {
    id: string;
    crew: string[];
  };
  patient: {
    name: string;
    age: number;
    sex: "M" | "F" | "Other";
    chiefComplaint: string;
  };
  vitals: {
    heartRate: number;
    spo2: number;
    bp: string;
    rr: number;
  };
  pickup: {
    label: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    address: string;
    phone?: string;
    lat: number;
    lng: number;
  };
  interventions: string[];
  nextSteps: string[];
};

const demoRun: AmbulanceRun = {
  runId: "RUN-AMB-07-2026-03-08",
  status: "Transporting",
  etaToHospitalMinutes: 9,
  unit: {
    id: "AMB-07",
    crew: ["Paramedic Aakash", "EMT Riya"],
  },
  patient: {
    name: "Unknown Male",
    age: 34,
    sex: "M",
    chiefComplaint: "RTA; head injury; bleeding",
  },
  vitals: {
    heartRate: 124,
    spo2: 92,
    bp: "98/62",
    rr: 24,
  },
  pickup: {
    label: "NH-48, Sector 18",
    lat: 28.4595,
    lng: 77.0266,
  },
  destination: {
    name: "City Trauma Center (Demo)",
    address: "Sector 21, Gurugram",
    phone: "+911000000010",
    lat: 28.4722,
    lng: 77.0583,
  },
  interventions: [
    "Pressure dressing applied",
    "IV line placed; fluids running",
    "C-spine immobilization",
    "Oxygen started",
  ],
  nextSteps: [
    "Update ER with ETA and vitals",
    "Prepare handover summary",
    "Maintain C-spine precautions",
  ],
};

function statusBadge(status: AmbulanceStatus) {
  switch (status) {
    case "Transporting":
      return "bg-red-600 text-white";
    case "On Scene":
      return "bg-orange-500 text-white";
    case "Responding":
      return "bg-blue-600 text-white";
    default:
      return "bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white";
  }
}

export default function AmbulanceDashboardPage() {
  const pickupMapsUrl = `https://www.google.com/maps?q=${demoRun.pickup.lat},${demoRun.pickup.lng}`;
  const destMapsUrl = `https://www.google.com/maps?q=${demoRun.destination.lat},${demoRun.destination.lng}`;
  const hospitalTel = demoRun.destination.phone
    ? `tel:${demoRun.destination.phone.replace(/\s+/g, "")}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e27] text-slate-900 dark:text-white transition-colors duration-300">
      <nav className="border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg rotate-45">
              <span className="-rotate-45">+</span>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold tracking-tight notranslate">
                EmerMedi
              </div>
              <div className="text-xs text-slate-600 dark:text-gray-400">
                Ambulance Crew (Demo)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-sm">
            <Link
              href="/doctor-dashboard"
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Open Hospital Intake
            </Link>
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Active Run
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 mt-1">
              Dispatch, patient snapshot, destination, and handover checklist.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusBadge(
                demoRun.status
              )}`}
            >
              {demoRun.status}
            </div>
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-right">
              <div className="text-xs text-slate-600 dark:text-gray-400">ETA</div>
              <div className="text-lg font-extrabold notranslate">
                {demoRun.etaToHospitalMinutes} min
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <section className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Run ID
                  </div>
                  <div className="font-semibold notranslate">{demoRun.runId}</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400 mt-2">
                    Unit
                  </div>
                  <div className="font-semibold">{demoRun.unit.id}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">
                    Crew: {demoRun.unit.crew.join(", ")}
                  </div>
                </div>

                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Patient
                  </div>
                  <div className="font-semibold">
                    {demoRun.patient.name} • {demoRun.patient.age} • {demoRun.patient.sex}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">
                    {demoRun.patient.chiefComplaint}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Vitals
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        HR
                      </div>
                      <div className="font-semibold notranslate">
                        {demoRun.vitals.heartRate} bpm
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        SpO₂
                      </div>
                      <div className="font-semibold notranslate">
                        {demoRun.vitals.spo2}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        BP
                      </div>
                      <div className="font-semibold notranslate">{demoRun.vitals.bp}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        RR
                      </div>
                      <div className="font-semibold notranslate">{demoRun.vitals.rr}/min</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Destination
                  </div>
                  <div className="font-semibold">{demoRun.destination.name}</div>
                  <div className="text-sm text-slate-600 dark:text-gray-400">
                    {demoRun.destination.address}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    <a
                      href={destMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors text-center"
                    >
                      Open Hospital in Maps
                    </a>
                    {hospitalTel ? (
                      <a
                        href={hospitalTel}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors text-center"
                      >
                        Call Hospital
                      </a>
                    ) : (
                      <div className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-slate-600 dark:text-gray-400 text-center">
                        Phone not available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Pickup
                  </div>
                  <div className="font-semibold">{demoRun.pickup.label}</div>
                  <a
                    href={pickupMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1 inline-block"
                  >
                    Open pickup in Maps
                  </a>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Quick Update
                  </div>
                  <div className="text-sm text-slate-700 dark:text-gray-300">
                    Share current vitals and ETA with ER.
                  </div>
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
                  >
                    Send ETA + Vitals
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Interventions</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-gray-300">
                {demoRun.interventions.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Next Steps</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-gray-300">
                {demoRun.nextSteps.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="text-red-500">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Handover Checklist</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-gray-300">
                {[
                  "Confirm patient identity",
                  "Last vitals + timestamp",
                  "Interventions performed",
                  "Medications given",
                  "Mechanism of injury / timeline",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-start gap-2 rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2"
                  >
                    <span className="mt-0.5 h-4 w-4 rounded border border-black/20 dark:border-white/20" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-slate-600 dark:text-gray-400">
                Demo-only; connect to ePCR later.
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Safety</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-gray-300">
                <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                  Seatbelts secured
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                  Equipment secured
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                  Monitor connected
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

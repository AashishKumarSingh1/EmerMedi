import Link from "next/link";

type IncomingCase = {
  id: string;
  receivedAt: string;
  etaMinutes: number;
  status: "En Route" | "Arrived" | "Stabilizing";
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  ambulanceId: string;
  patient: {
    name: string;
    age: number;
    sex: "M" | "F" | "Other";
    bloodGroup?: string;
  };
  chiefComplaint: string;
  vitals: {
    heartRate: number;
    spo2: number;
    bp: string;
    rr: number;
    tempC: number;
    gcs: number;
  };
  notes: string[];
  caller: {
    label: string;
    phone?: string;
  };
  pickup: {
    label: string;
    lat: number;
    lng: number;
  };
};

const demoCases: IncomingCase[] = [
  {
    id: "EM-INTAKE-02481",
    receivedAt: "2 min ago",
    etaMinutes: 6,
    status: "En Route",
    severity: "CRITICAL",
    ambulanceId: "AMB-07",
    patient: { name: "Unknown Male", age: 34, sex: "M", bloodGroup: "O+" },
    chiefComplaint: "Road traffic accident; suspected head injury",
    vitals: {
      heartRate: 128,
      spo2: 91,
      bp: "92/58",
      rr: 26,
      tempC: 36.8,
      gcs: 10,
    },
    notes: [
      "Bleeding controlled with pressure dressing",
      "IV access established; fluids started",
      "Cervical collar applied",
    ],
    caller: { label: "Ambulance Crew", phone: "+911000000001" },
    pickup: { label: "NH-48, Sector 18", lat: 28.4595, lng: 77.0266 },
  },
  {
    id: "EM-INTAKE-02482",
    receivedAt: "7 min ago",
    etaMinutes: 14,
    status: "En Route",
    severity: "HIGH",
    ambulanceId: "AMB-12",
    patient: { name: "Anita Sharma", age: 58, sex: "F", bloodGroup: "A+" },
    chiefComplaint: "Chest pain radiating to left arm; diaphoresis",
    vitals: {
      heartRate: 104,
      spo2: 95,
      bp: "148/92",
      rr: 20,
      tempC: 37.1,
      gcs: 15,
    },
    notes: ["12-lead ECG performed", "Aspirin given", "O2 via nasal cannula"],
    caller: { label: "Dispatcher", phone: "+911000000002" },
    pickup: { label: "DLF Phase 3", lat: 28.4989, lng: 77.0886 },
  },
];

function severityStyles(severity: IncomingCase["severity"]) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    default:
      return "bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white";
  }
}

export default function DoctorDashboardPage() {
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
                Hospital Intake (Demo)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
            >
              Signup
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Incoming Patients
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 mt-1">
              Live-looking demo UI for hospital/doctor intake.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/ambulance-dashboard"
              className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-semibold"
            >
              Open Ambulance Dashboard
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <section className="lg:col-span-2 space-y-4 sm:space-y-6">
            {demoCases.map((item) => {
              const mapsUrl = `https://www.google.com/maps?q=${item.pickup.lat},${item.pickup.lng}`;
              const callerTel = item.caller.phone
                ? `tel:${item.caller.phone.replace(/\s+/g, "")}`
                : null;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${severityStyles(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </div>
                      <div>
                        <div className="font-semibold tracking-tight">
                          {item.patient.name} • {item.patient.age} • {item.patient.sex}
                          {item.patient.bloodGroup ? ` • ${item.patient.bloodGroup}` : ""}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-gray-400">
                          {item.chiefComplaint}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-slate-600 dark:text-gray-400">
                          ETA
                        </div>
                        <div className="text-lg font-extrabold notranslate">
                          {item.etaMinutes} min
                        </div>
                      </div>
                      <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                      <div className="text-right">
                        <div className="text-xs text-slate-600 dark:text-gray-400">
                          Status
                        </div>
                        <div className="text-sm font-semibold">{item.status}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        Case
                      </div>
                      <div className="font-semibold">{item.id}</div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                        Received {item.receivedAt}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        Ambulance
                      </div>
                      <div className="font-semibold">{item.ambulanceId}</div>
                      <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                        Caller: {item.caller.label}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        Pickup
                      </div>
                      <div className="font-semibold">{item.pickup.label}</div>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1 inline-block"
                      >
                        Open in Maps
                      </a>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        Vitals (last reported)
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            HR
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.heartRate} bpm
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            SpO₂
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.spo2}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            BP
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.bp}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            RR
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.rr}/min
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            Temp
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.tempC}°C
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            GCS
                          </div>
                          <div className="font-semibold notranslate">
                            {item.vitals.gcs}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3">
                      <div className="text-xs text-slate-600 dark:text-gray-400">
                        Pre-arrival notes
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-gray-300">
                        {item.notes.map((n) => (
                          <li key={n} className="flex gap-2">
                            <span className="text-red-500">•</span>
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                    >
                      Alert Trauma / ER Team
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
                    >
                      Reserve Bed
                    </button>
                    {callerTel ? (
                      <a
                        href={callerTel}
                        className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors text-center"
                      >
                        Call ({item.caller.phone})
                      </a>
                    ) : (
                      <div className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-slate-600 dark:text-gray-400 text-center">
                        Caller phone not available
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="space-y-4 sm:space-y-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Facility Status</div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    ER Beds
                  </div>
                  <div className="text-2xl font-extrabold notranslate">4</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Available
                  </div>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    ICU Beds
                  </div>
                  <div className="text-2xl font-extrabold notranslate">1</div>
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Available
                  </div>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    CT
                  </div>
                  <div className="text-sm font-semibold">Ready</div>
                </div>
                <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
                  <div className="text-xs text-slate-600 dark:text-gray-400">
                    Blood Bank
                  </div>
                  <div className="text-sm font-semibold">Available</div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-600 dark:text-gray-400">
                Demo-only numbers; wire to real ops later.
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl p-4 sm:p-5">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
                >
                  Print Intake Summary
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
                >
                  Notify Radiology
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors"
                >
                  Notify Cardiology
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

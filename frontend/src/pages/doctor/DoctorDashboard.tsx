import { 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  User, 
  Calendar, 
  ScanLine, 
  ArrowUpRight, 
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  X
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientTable from "../../components/doctor/PatientTable";
import { getDashboardData, getDoctorProfile } from "../../services/doctorService";
import type { DoctorProfile } from "../../types/doctor";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export interface ClinicalPatientProfile {
  id: number;
  external_id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  bloodGroup: string;
  chronicCondition: string;
  testType: string;
  status: string;
  documentsCount: number;
  eventsCount: number;
  verifiedCount: number;
  pendingCount: number;
  conflictsCount: number;
  primaryHospital: string;
  lastAccessed: string;
}

export const BENCHMARK_PATIENTS: ClinicalPatientProfile[] = [
  {
    id: 101,
    external_id: "PAT-101",
    name: "Rajesh Sharma",
    age: 72,
    gender: "Male",
    bloodGroup: "O+",
    chronicCondition: "CAD · Post-PCI Stenting · T2D",
    testType: "Cardio-Metabolic Longitudinal Dossier",
    status: "Active Dossier",
    documentsCount: 5,
    eventsCount: 36,
    verifiedCount: 32,
    pendingCount: 4,
    conflictsCount: 1,
    primaryHospital: "Apollo Heart Institute",
    lastAccessed: "Today, 10:42 AM",
  },
  {
    id: 102,
    external_id: "PAT-102",
    name: "Priya Patel",
    age: 32,
    gender: "Female",
    bloodGroup: "B+",
    chronicCondition: "Moderate Asthma · Ceftriaxone Allergy",
    testType: "Pulmonary & Critical Allergy Dossier",
    status: "Active Dossier",
    documentsCount: 2,
    eventsCount: 8,
    verifiedCount: 7,
    pendingCount: 1,
    conflictsCount: 1,
    primaryHospital: "Manipal Hospital",
    lastAccessed: "Today, 09:15 AM",
  },
  {
    id: 103,
    external_id: "PAT-103",
    name: "Vikram Malhotra",
    age: 55,
    gender: "Male",
    bloodGroup: "A+",
    chronicCondition: "Dyslipidemia · Essential Hypertension",
    testType: "Cardiovascular Risk & Lipid Screen",
    status: "Active Dossier",
    documentsCount: 2,
    eventsCount: 9,
    verifiedCount: 8,
    pendingCount: 1,
    conflictsCount: 1,
    primaryHospital: "Apollo Clinic",
    lastAccessed: "Yesterday, 4:20 PM",
  },
  {
    id: 104,
    external_id: "PAT-104",
    name: "Mohammed Irfan",
    age: 64,
    gender: "Male",
    bloodGroup: "O-",
    chronicCondition: "Type-2 Diabetes Mellitus · CKD Stage 2",
    testType: "Renal & Glycemic Longitudinal Dossier",
    status: "Active Dossier",
    documentsCount: 2,
    eventsCount: 28,
    verifiedCount: 25,
    pendingCount: 3,
    conflictsCount: 1,
    primaryHospital: "Max Healthcare",
    lastAccessed: "12 Nov 2026",
  },
  {
    id: 105,
    external_id: "PAT-105",
    name: "David Fernandes",
    age: 29,
    gender: "Male",
    bloodGroup: "AB+",
    chronicCondition: "Nil Known Chronic Conditions",
    testType: "Annual Preventive Care Screening",
    status: "Active Dossier",
    documentsCount: 1,
    eventsCount: 4,
    verifiedCount: 4,
    pendingCount: 0,
    conflictsCount: 0,
    primaryHospital: "Manipal Hospital",
    lastAccessed: "10 Nov 2026",
  },
];

export default function DoctorDashboard() {
  const [data, setData] = useState<DashboardData>();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [activePatientIndex, setActivePatientIndex] = useState<number>(0);
  const [isShaking, setIsShaking] = useState(false);
  const referralRef = useRef<HTMLDivElement | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState<{
    doctor: string;
    specialty: string;
    token: string;
    time: string;
    bypassedDoctor: string;
    bypassedQueue: number;
    queueDepth: number;
    isRevoked?: boolean;
    revokedAt?: string;
    isApproved?: boolean;
    isDismissed?: boolean;
  } | null>(() => {
    try {
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isApproved || parsed.isDismissed) {
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const handleAcknowledgeReferral = () => {
    try {
      localStorage.setItem("medthread_emergency_notif_read", "true");
      setEmergencyAlert((prev) => {
        if (!prev) return null;
        const updated = { ...prev, isApproved: true, isDismissed: true };
        localStorage.setItem("medthread_emergency_dispatch", JSON.stringify(updated));
        return updated;
      });
      window.dispatchEvent(new CustomEvent("medthread_emergency_read"));
      const bc = new BroadcastChannel("medthread_live_notifications");
      bc.postMessage({ type: "EMERGENCY_READ" });
      bc.close();
    } catch {}

    // Auto-dismiss the banner smoothly after accepting
    setTimeout(() => {
      setEmergencyAlert(null);
    }, 500);
  };

  const handleDismissReferral = () => {
    try {
      localStorage.setItem("medthread_emergency_notif_read", "true");
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isDismissed = true;
        parsed.isApproved = true;
        localStorage.setItem("medthread_emergency_dispatch", JSON.stringify(parsed));
      }
      window.dispatchEvent(new CustomEvent("medthread_emergency_read"));
      const bc = new BroadcastChannel("medthread_live_notifications");
      bc.postMessage({ type: "EMERGENCY_READ" });
      bc.close();
    } catch {}
    setEmergencyAlert(null);
  };

  useEffect(() => {
    void getDashboardData().then(setData);
    void getDoctorProfile().then(setProfile);

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<DoctorProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        void getDoctorProfile().then(setProfile);
      }
    };

    const handleEmergency = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      if (customEvent.detail) {
        if (!customEvent.detail.isApproved && !customEvent.detail.isDismissed) {
          setEmergencyAlert(customEvent.detail);
        }
      } else {
        try {
          const stored = localStorage.getItem("medthread_emergency_dispatch");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!parsed.isApproved && !parsed.isDismissed) {
              setEmergencyAlert(parsed);
            }
          }
        } catch {}
      }
    };

    const handleRevocation = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const detail = customEvent.detail;
      setEmergencyAlert((prev) =>
        prev
          ? {
              ...prev,
              isRevoked: true,
              revokedAt: detail?.time || new Date().toLocaleTimeString(),
            }
          : null
      );
    };

    window.addEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
    window.addEventListener("medthread_emergency_dispatched", handleEmergency);
    window.addEventListener("medthread_access_revoked", handleRevocation);

    // Cross-tab broadcast listener for instant doctor sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("medthread_live_notifications");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "ACCESS_REVOKED") {
          setEmergencyAlert((prev) =>
            prev
              ? {
                  ...prev,
                  isRevoked: true,
                  revokedAt: ev.data?.time || new Date().toLocaleTimeString(),
                }
              : null
          );
        } else if (ev.data?.type === "EMERGENCY_DISPATCH") {
          setIsShaking(true);
          referralRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setIsShaking(false), 2200);
        }
      };
    } catch {}

    const handleHighlight = () => {
      setEmergencyAlert((prev) => {
        if (prev && !prev.isDismissed) {
          return prev;
        }
        try {
          const stored = localStorage.getItem("medthread_emergency_dispatch");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!parsed.isApproved && !parsed.isDismissed) {
              return parsed;
            }
          }
        } catch {}
        return null;
      });

      setTimeout(() => {
        if (referralRef.current) {
          setIsShaking(true);
          referralRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setIsShaking(false), 2200);
        }
      }, 60);
    };

    window.addEventListener("medthread_highlight_referral", handleHighlight);

    return () => {
      window.removeEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
      window.removeEventListener("medthread_emergency_dispatched", handleEmergency);
      window.removeEventListener("medthread_access_revoked", handleRevocation);
      window.removeEventListener("medthread_highlight_referral", handleHighlight);
      if (bc) bc.close();
    };
  }, []);

  if (!data) return <LoadingSpinner />;

  const doctorName = profile?.name || "Dr. Ananya Rao";
  const currentPatient = BENCHMARK_PATIENTS[activePatientIndex] || BENCHMARK_PATIENTS[0];
  const recentPatientsList = BENCHMARK_PATIENTS.map((p) => ({
    id: p.external_id,
    name: p.name,
    lastAccessed: p.lastAccessed,
    status: "Active" as const,
  }));

  const handlePrevPatient = () => {
    setActivePatientIndex((prev) => (prev > 0 ? prev - 1 : BENCHMARK_PATIENTS.length - 1));
  };

  const handleNextPatient = () => {
    setActivePatientIndex((prev) => (prev < BENCHMARK_PATIENTS.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Greeting Headline (Exact reference style: Hello, Dr. Lolly. Ready to Review Patient Data?) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {doctorName}. Ready to Review Patient Data?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Evidence-First Clinical Cockpit • 100% Verifiable Medical History
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/doctor/scan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition"
          >
            <ScanLine size={15} />
            <span>Scan Patient QR</span>
          </Link>
        </div>
      </div>

      {/* Specialist Referral / Queue Dispatch HUD Banner */}
      {emergencyAlert && (
        <div
          ref={referralRef}
          id="referral-alert-banner"
          className={`rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
            isShaking
              ? "animate-clinical-shake ring-4 ring-forest ring-offset-4 scale-[1.015] shadow-2xl bg-emerald-50/30"
              : ""
          } ${
            emergencyAlert.isRevoked
              ? "border-amber-300 bg-amber-50/20 border-l-4 border-l-amber-500"
              : "border-slate-200/90 bg-white border-l-4 border-l-forest"
          }`}
        >
          <div className="p-4 sm:p-5">
            {/* Top Row: Meta Header + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    emergencyAlert.isRevoked
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-forest/10 text-forest border border-forest/20"
                  }`}
                >
                  {emergencyAlert.isRevoked ? "Access Revoked" : "Specialist Referral Active"}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  Patient Rajesh Sharma (PAT-101)
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {emergencyAlert.token}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {!emergencyAlert.isRevoked && (
                  <>
                    {!emergencyAlert.isApproved ? (
                      <button
                        type="button"
                        onClick={handleAcknowledgeReferral}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-xs cursor-pointer"
                        title="Acknowledge and accept referral queue assignment"
                      >
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Accept Referral</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <CheckCircle2 size={12} className="text-emerald-700" />
                        <span>Accepted</span>
                      </span>
                    )}
                    <Link
                      to="/doctor/patients/101"
                      onClick={handleAcknowledgeReferral}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest/90 text-white text-xs font-bold transition shadow-xs"
                    >
                      <span>Open Patient Dossier</span>
                      <ArrowRight size={13} />
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDismissReferral}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Bottom Row: 3 Clean Structured Badges */}
            {emergencyAlert.isRevoked ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>
                  The patient revoked authorization at {emergencyAlert.revokedAt || "recently"}. Cryptographic access token has been terminated.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 1. Assigned Doctor */}
                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Assigned Specialist
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {emergencyAlert.doctor}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {emergencyAlert.queueDepth} in queue
                  </span>
                </div>

                {/* 2. Bypassed Doctor (Overloaded) */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Bypassed (Overloaded)
                    </span>
                    <span className="font-bold text-slate-700 text-xs">
                      {emergencyAlert.bypassedDoctor}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {emergencyAlert.bypassedQueue} waiting
                  </span>
                </div>

                {/* 3. Clinical Warning */}
                <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/70 flex items-center gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                      Clinical Risk Alert
                    </span>
                    <span className="font-semibold text-rose-900 text-[11px] truncate block">
                      Aspirin held for hernia surgery (Feb 2024)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main HUD Grid: Real Longitudinal Patient Cohort & Contradiction Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8 cols): Line Graph + Bottom Dual Cards */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Card: Longitudinal Records & Events Graph across 5 Patients */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-heading font-bold text-slate-900 text-base">
                  Longitudinal Clinical Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Extracted timeline facts &amp; hospital records across the cohort
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  85 Events Grounded
                </span>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  12 Hospital PDFs
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Dual Curve Graph (SVG) across 5 Patients */}
              <div className="md:col-span-9 h-48 sm:h-56 relative w-full flex flex-col justify-end">
                {/* Background grid lines with fact count scale */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
                  <div className="border-b border-slate-100 pb-1 flex justify-between">
                    <span>40 facts</span>
                    <span className="text-slate-300">Max</span>
                  </div>
                  <div className="border-b border-slate-100 pb-1">30 facts</div>
                  <div className="border-b border-slate-100 pb-1">20 facts</div>
                  <div className="border-b border-slate-100 pb-1">10 facts</div>
                </div>

                {/* SVG Curves */}
                <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 550 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4682B4" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4682B4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area fill under Line 1 */}
                  <polygon
                    fill="url(#blueLineGrad)"
                    points="55,170 55,25 175,145 295,140 415,58 515,160 515,170"
                  />

                  {/* Line 1: Primary Teal/Blue (Clinical Facts: 36, 8, 9, 28, 4) */}
                  <polyline
                    fill="none"
                    stroke="#4682B4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="55,25 175,145 295,140 415,58 515,160"
                  />
                  {/* Line 1 Data Dots */}
                  {[
                    [55, 25, "36 facts (Rajesh)"],
                    [175, 145, "8 facts (Priya)"],
                    [295, 140, "9 facts (Vikram)"],
                    [415, 58, "28 facts (Irfan)"],
                    [515, 160, "4 facts (David)"],
                  ].map(([cx, cy, label], i) => (
                    <g key={`dot-blue-${i}`}>
                      <circle cx={cx as number} cy={cy as number} r="5" fill="#4682B4" stroke="#fff" strokeWidth="2" />
                      <text x={(cx as number) + 6} y={(cy as number) - 6} fill="#1e293b" fontSize="10" fontWeight="bold">
                        {label.toString().split(" ")[0]}
                      </text>
                    </g>
                  ))}

                  {/* Line 2: Soft Purple (Ingested PDFs: 5, 2, 2, 2, 1 scaled) */}
                  <polyline
                    fill="none"
                    stroke="#9478BF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4 3"
                    points="55,148 175,160 295,160 415,160 515,165"
                  />
                  {[
                    [55, 148],
                    [175, 160],
                    [295, 160],
                    [415, 160],
                    [515, 165],
                  ].map(([cx, cy], i) => (
                    <circle key={`dot-purp-${i}`} cx={cx as number} cy={cy as number} r="3.5" fill="#9478BF" stroke="#fff" strokeWidth="1.5" />
                  ))}
                </svg>

                {/* X-Axis: 5 Patients */}
                <div className="flex justify-between text-[11px] text-slate-600 font-semibold pt-3 border-t border-slate-200 mt-2 px-2">
                  <span className={`px-2 py-0.5 rounded font-extrabold ${activePatientIndex === 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    PAT-101 (Rajesh)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${activePatientIndex === 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    PAT-102 (Priya)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${activePatientIndex === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    PAT-103 (Vikram)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${activePatientIndex === 3 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    PAT-104 (Irfan)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${activePatientIndex === 4 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"}`}>
                    PAT-105 (David)
                  </span>
                </div>
              </div>

              {/* Right Stat Pills */}
              <div className="md:col-span-3 flex md:flex-col justify-around gap-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-2xl font-black text-slate-900 font-heading">
                    <span>85</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4682B4]" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-700">
                    Extracted Facts
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Medications, labs, notes
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-2xl font-black text-slate-900 font-heading">
                    <span>12</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9478BF]" />
                  </div>
                  <div className="text-[11px] font-bold text-slate-700">
                    Hospital Documents
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Across 4 health networks
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-2xl font-black text-purple-700 font-heading">
                    <span>4</span>
                    <AlertCircle size={14} className="text-purple-600" />
                  </div>
                  <div className="text-[11px] font-bold text-purple-900">
                    Conflict Radar Flags
                  </div>
                  <div className="text-[10px] text-purple-600">
                    Cross-hospital alerts
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Hospital Ingestion Bars + Patient Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bottom Card 1: Multi-Hospital Ingestion Chart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-sm">
                    Hospital Ingestion Volume
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    12 documents parsed across 4 networks
                  </p>
                </div>
                <Link
                  to="/doctor/recent-patients"
                  className="text-xs font-bold text-forest hover:underline"
                >
                  View all
                </Link>
              </div>

              {/* 4 Hospital Network Visual Bars */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Apollo Heart Institute
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">5 Documents (42%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[42%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Manipal Hospital
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">3 Documents (25%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[25%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Fortis Healthcare
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">2 Documents (17%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full w-[17%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Max Healthcare &amp; Diagnostics
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">2 Documents (16%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full w-[16%]" />
                  </div>
                </div>

                {/* 12-Document Sparklines Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Document Fact Yield (12 PDFs)
                  </div>
                  <div className="flex items-end gap-1 h-7">
                    {[36, 12, 18, 14, 22, 8, 10, 9, 15, 28, 14, 4].map((val, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full ${idx < 5 ? "bg-emerald-400" : idx < 8 ? "bg-blue-400" : idx < 10 ? "bg-indigo-400" : "bg-purple-400"}`}
                        style={{ height: `${Math.min(100, (val / 36) * 100)}%` }}
                        title={`Doc ${idx + 1}: ${val} facts`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card 2: Patient Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-slate-900 text-sm">
                    Patient Profile
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({activePatientIndex + 1}/{BENCHMARK_PATIENTS.length})
                  </span>
                </div>
                <span className="text-slate-400 p-1" title="Select patient to view longitudinal history">
                  <Info size={16} />
                </span>
              </div>

              {/* Summary Attributes Grid (Exact Stored Profile) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <User size={12} />
                    <span>Name</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    {currentPatient.name}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Patient ID
                  </div>
                  <div className="font-bold text-slate-900 font-mono text-xs">
                    {currentPatient.external_id}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Age / Gender</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {currentPatient.age} yrs • {currentPatient.gender}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Blood Group
                  </div>
                  <div className="font-bold text-slate-900">
                    {currentPatient.bloodGroup}
                  </div>
                </div>

                <div className="space-y-0.5 col-span-2">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Activity size={12} />
                    <span>Clinical Profile / Chronic</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate text-[11px]" title={currentPatient.chronicCondition}>
                    {currentPatient.chronicCondition}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Ingested Records
                  </div>
                  <div className="font-bold text-slate-700 text-[11px]">
                    {currentPatient.documentsCount} Docs • {currentPatient.eventsCount} Events
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Conflict Status
                  </div>
                  <div>
                    {currentPatient.conflictsCount > 0 ? (
                      <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full inline-block text-[10px] border border-purple-200">
                        1 Conflict Flagged
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full inline-block text-[10px]">
                        Clean Baseline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Pagination & Dossier Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPatient}
                    className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Previous patient"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextPatient}
                    className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Next patient"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activePatientIndex + 1}/{BENCHMARK_PATIENTS.length}
                  </span>
                </div>

                <Link
                  to={`/doctor/patients/${currentPatient.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-forest hover:underline transition"
                >
                  <span>Open Dossier</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (4 cols): Multi-Hospital Network Convergence Diagram (SVG) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#F0F7F4] via-[#F6FAF8] to-[#E8F2ED] rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div>
              <h2 className="font-heading font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                Hospital Network Graph
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                4 Health systems converging into 1 timeline
              </p>
            </div>
            <span className="p-1 rounded-lg bg-forest/10 text-forest">
              <Activity size={16} />
            </span>
          </div>

          {/* Futuristic SVG Multi-Hospital Network Diagram */}
          <div className="my-2 relative flex items-center justify-center h-44">
            <svg className="w-full h-full max-w-[280px] overflow-visible" viewBox="0 0 260 160">
              {/* Connecting animated data beams converging into center */}
              <line x1="40" y1="35" x2="130" y2="80" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <line x1="220" y1="35" x2="130" y2="80" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <line x1="40" y1="125" x2="130" y2="80" stroke="#4F46E5" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />
              <line x1="220" y1="125" x2="130" y2="80" stroke="#7C3AED" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />

              {/* Center Node: Unified Patient Timeline */}
              <circle cx="130" cy="80" r="24" fill="#16472E" />
              <circle cx="130" cy="80" r="28" fill="none" stroke="#16472E" strokeWidth="1.5" opacity="0.4" />
              <text x="130" y="77" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">MEDTHREAD</text>
              <text x="130" y="88" textAnchor="middle" fill="#86EFAC" fontSize="8" fontWeight="bold">PAT-101</text>

              {/* Node 1: Apollo Heart */}
              <circle cx="40" cy="35" r="16" fill="#059669" />
              <text x="40" y="38" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Apollo</text>
              <text x="40" y="58" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">5 records</text>

              {/* Node 2: Manipal */}
              <circle cx="220" cy="35" r="16" fill="#2563EB" />
              <text x="220" y="38" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Manipal</text>
              <text x="220" y="58" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">3 records</text>

              {/* Node 3: Fortis */}
              <circle cx="40" cy="125" r="16" fill="#4F46E5" />
              <text x="40" y="128" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Fortis</text>
              <text x="40" y="148" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">2 records</text>

              {/* Node 4: Max */}
              <circle cx="220" cy="125" r="16" fill="#7C3AED" />
              <text x="220" y="128" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">Max/Lab</text>
              <text x="220" y="148" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">2 records</text>
            </svg>
          </div>

          {/* Active Contradiction Badges (Real conflicts) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
              <span className="flex items-center gap-1 text-purple-800">
                <AlertCircle size={13} className="text-purple-600" />
                <span>Conflict Radar Detected</span>
              </span>
              <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                4 Flags
              </span>
            </div>

            <Link
              to="/doctor/patients/101"
              className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 block text-left transition group"
            >
              <div className="flex justify-between text-[10px] font-bold text-slate-900 group-hover:text-forest">
                <span>Rajesh Sharma (PAT-101)</span>
                <span className="text-rose-700">Aspirin Held vs Active</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Apollo Surgery held Aspirin ➔ Cardiology resumed
              </div>
            </Link>

            <Link
              to="/doctor/patients/102"
              className="p-2 rounded-xl bg-white/90 hover:bg-white border border-slate-200 block text-left transition group"
            >
              <div className="flex justify-between text-[10px] font-bold text-slate-900 group-hover:text-forest">
                <span>Priya Patel (PAT-102)</span>
                <span className="text-purple-700">Allergy Anaphylaxis</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                Manipal Checkup NKDA ➔ Aster ER Anaphylaxis
              </div>
            </Link>
          </div>

          {/* Bottom Footnote */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
            <span>Deterministic PS-7 Engine</span>
            <span className="font-bold text-forest">12 Hospital Records Grounded</span>
          </div>

        </div>

      </div>

      {/* Bottom Section: Recent Patient Access & Records Table */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
              Recent Patient Records &amp; Timeline Access
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Only authorized patient records with cryptographic consent verification.
            </p>
          </div>
          <Link
            to="/doctor/recent-patients"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>View All Patients</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <PatientTable patients={recentPatientsList} />
      </section>

    </div>
  );
}

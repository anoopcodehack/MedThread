import { 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  MoreHorizontal, 
  User, 
  Calendar, 
  Dna, 
  ScanLine, 
  ArrowUpRight, 
  Activity,
  AlertCircle,
  ArrowRight,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PatientTable from "../../components/doctor/PatientTable";
import { getDashboardData, getDoctorProfile } from "../../services/doctorService";
import type { DoctorProfile } from "../../types/doctor";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DoctorDashboard() {
  const [data, setData] = useState<DashboardData>();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [activePatientIndex, setActivePatientIndex] = useState<number>(0);
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
  } | null>(() => {
    try {
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      return stored ? JSON.parse(stored) : {
        doctor: "Dr. Suresh Menon, MD",
        specialty: "Cardiology",
        token: "MT-ER-948271",
        time: "Just now",
        bypassedDoctor: "Dr. Ananya Rao, MD",
        bypassedQueue: 5,
        queueDepth: 1,
      };
    } catch {
      return null;
    }
  });

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
        setEmergencyAlert(customEvent.detail);
      } else {
        try {
          const stored = localStorage.getItem("medthread_emergency_dispatch");
          if (stored) setEmergencyAlert(JSON.parse(stored));
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
        }
      };
    } catch {}

    return () => {
      window.removeEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
      window.removeEventListener("medthread_emergency_dispatched", handleEmergency);
      window.removeEventListener("medthread_access_revoked", handleRevocation);
      if (bc) bc.close();
    };
  }, []);

  if (!data) return <LoadingSpinner />;

  const doctorName = profile?.name || "Dr. Ananya Rao";
  const recentPatients = data.recentPatients || [];
  const currentPatient = recentPatients[activePatientIndex] || {
    id: "101",
    name: "Sarah Johnson",
    lastAccessed: "Today, 10:30 AM",
    status: "Active"
  };

  const handlePrevPatient = () => {
    setActivePatientIndex((prev) => (prev > 0 ? prev - 1 : recentPatients.length - 1));
  };

  const handleNextPatient = () => {
    setActivePatientIndex((prev) => (prev < recentPatients.length - 1 ? prev + 1 : 0));
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
          className={`rounded-2xl border transition shadow-xs overflow-hidden ${
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
                  <Link
                    to="/doctor/patients/101"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest/90 text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Open Patient Dossier</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setEmergencyAlert(null)}
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

      {/* Main HUD Grid matching User Reference (media_1794540834403_31de41f0.jpg) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8 cols): Clinical Performance + Bottom Dual Cards */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Card: Clinical Performance (Line Chart + 89% / 29% stats) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-slate-900 text-base">
                Clinical Performance
              </h2>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Dual Line Chart (SVG) */}
              <div className="md:col-span-9 h-48 sm:h-56 relative w-full flex flex-col justify-end">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
                  <div className="border-b border-slate-100 pb-1">90</div>
                  <div className="border-b border-slate-100 pb-1">70</div>
                  <div className="border-b border-slate-100 pb-1">50</div>
                  <div className="border-b border-slate-100 pb-1">30</div>
                </div>

                {/* SVG Curves */}
                <svg className="w-full h-full overflow-visible z-10" viewBox="0 0 550 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blueLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4682B4" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#4682B4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Line 1: Primary Teal/Blue (Completed Reviews) */}
                  <polyline
                    fill="none"
                    stroke="#4682B4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,130 65,50 110,85 155,60 200,45 245,100 290,75 335,50 380,80 425,65 470,110 520,40"
                  />
                  {/* Line 1 Data Dots */}
                  {[
                    [20,130], [65,50], [110,85], [155,60], [200,45], [245,100],
                    [290,75], [335,50], [380,80], [425,65], [470,110], [520,40]
                  ].map(([cx, cy], i) => (
                    <circle key={`dot-blue-${i}`} cx={cx} cy={cy} r="3" fill="#4682B4" />
                  ))}

                  {/* Line 2: Soft Purple (Pending Verification) */}
                  <polyline
                    fill="none"
                    stroke="#9478BF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4 2"
                    points="20,150 65,75 110,95 155,120 200,85 245,110 290,95 335,115 380,90 425,100 470,145 520,95"
                  />
                  {/* Line 2 Data Dots */}
                  {[
                    [20,150], [65,75], [110,95], [155,120], [200,85], [245,110],
                    [290,95], [335,115], [380,90], [425,100], [470,145], [520,95]
                  ].map(([cx, cy], i) => (
                    <circle key={`dot-purp-${i}`} cx={cx} cy={cy} r="2.5" fill="#9478BF" />
                  ))}
                </svg>

                {/* Month Axis */}
                <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-3 border-t border-slate-200 mt-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>

              {/* Right Stat Pills matching reference */}
              <div className="md:col-span-3 flex md:flex-col justify-around gap-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-lg font-black text-slate-900">
                    <span>89%</span>
                    <CheckCircle2 size={16} className="text-[#4682B4]" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Completed
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-lg font-black text-slate-900">
                    <span>29%</span>
                    <Clock size={16} className="text-[#9478BF]" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Test Performance Overview + Patient Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bottom Card 1: Test Performance Overview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-slate-900 text-sm">
                  Test Performance Overview
                </h3>
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Clinical test metrics
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    77.24%
                  </div>
                </div>

                {/* Status Badges Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800">88%</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800">19%</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800">19/5</span>
                    <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-medium">Reviewed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800">14/0</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">Schedule</span>
                  </div>
                </div>

                {/* Vertical Bar Sparkline Chart & View All Pill */}
                <div className="flex items-end justify-between pt-2">
                  <div className="flex items-end gap-1 h-10">
                    {[40, 75, 55, 90, 60, 85, 45, 100, 65, 80, 50, 70, 95, 60].map((h, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full ${
                          idx % 3 === 0
                            ? "bg-emerald-400"
                            : idx % 3 === 1
                            ? "bg-blue-400"
                            : "bg-purple-400"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  <Link
                    to="/doctor/recent-patients"
                    className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition"
                  >
                    view all
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Card 2: Patient Summary */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-slate-900 text-sm">
                  Patient Summary
                </h3>
                <span className="text-slate-400 p-1">
                  <Info size={16} />
                </span>
              </div>

              {/* Summary Attributes Grid */}
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
                  <div className="font-bold text-slate-900">
                    PT-{currentPatient.id}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Age</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {activePatientIndex % 2 === 0 ? "52" : "38"}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Gender
                  </div>
                  <div className="font-bold text-slate-900">
                    {activePatientIndex % 2 === 0 ? "Female" : "Male"}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <Activity size={12} />
                    <span>Test Type</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">
                    DNA &amp; Cardio Screen
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Status
                  </div>
                  <div className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block text-[10px]">
                    In Progress
                  </div>
                </div>
              </div>

              {/* Bottom Pagination & Dossier Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPatient}
                    className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                    title="Previous patient"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextPatient}
                    className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                    title="Next patient"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <Link
                  to={`/doctor/patients/${currentPatient.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 hover:text-emerald-700 transition"
                >
                  <span>Open Dossier</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (4 cols): DNA Analysis / Genetic Overview Panel */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#E2F0F9] via-[#EBF4FA] to-[#DEEFF8] rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
          
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-2">
            <h2 className="font-heading font-extrabold text-slate-900 text-lg">
              DNA Analysis
            </h2>
            <span className="p-1.5 rounded-full bg-white/60 text-slate-600">
              <Dna size={18} />
            </span>
          </div>

          {/* 3D Glass Helix Visual Canvas (SVG) */}
          <div className="relative my-4 flex items-center justify-center h-52 sm:h-64">
            {/* Ambient water/glass glow */}
            <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Stylized Double Helix SVG */}
            <svg className="w-full h-full max-w-[280px] overflow-visible" viewBox="0 0 200 240">
              <defs>
                <linearGradient id="helixGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4FA8DE" />
                  <stop offset="100%" stopColor="#0E6BA8" />
                </linearGradient>
                <linearGradient id="helixGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#72EFDD" />
                  <stop offset="100%" stopColor="#48BFE3" />
                </linearGradient>
              </defs>

              {/* Connecting hydrogen rungs */}
              {[40, 70, 100, 130, 160, 190].map((y, i) => {
                const spread = Math.sin(i * 1.2) * 45;
                return (
                  <line
                    key={`rung-${i}`}
                    x1={100 - spread}
                    y1={y}
                    x2={100 + spread}
                    y2={y}
                    stroke="#BEE1E6"
                    strokeWidth="2"
                    strokeOpacity="0.8"
                    strokeDasharray="2 3"
                  />
                );
              })}

              {/* Strand 1 */}
              <path
                d="M 60,20 Q 150,80 60,140 T 60,220"
                fill="none"
                stroke="url(#helixGrad1)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Strand 2 */}
              <path
                d="M 140,20 Q 50,80 140,140 T 140,220"
                fill="none"
                stroke="url(#helixGrad2)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Floating glossy fluid nodes */}
              <circle cx="60" cy="20" r="7" fill="#72EFDD" opacity="0.9" />
              <circle cx="140" cy="20" r="7" fill="#4FA8DE" opacity="0.9" />
              <circle cx="150" cy="80" r="8" fill="#48CAE4" opacity="0.9" />
              <circle cx="50" cy="80" r="8" fill="#0077B6" opacity="0.9" />
              <circle cx="60" cy="140" r="7" fill="#72EFDD" opacity="0.9" />
              <circle cx="140" cy="140" r="7" fill="#4FA8DE" opacity="0.9" />
              <circle cx="100" cy="220" r="9" fill="#023E8A" opacity="0.9" />
            </svg>
          </div>

          {/* Frosted Glassmorphism Overlay Card (Exact reference style) */}
          <div className="relative z-10 bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100/80 text-blue-700">
                <Dna size={14} />
              </div>
              <div>
                <div className="font-heading font-bold text-xs text-slate-900 leading-tight">
                  Genetic Overview
                </div>
                <div className="text-[10px] text-slate-500">
                  Your current DNA health summary
                </div>
              </div>
            </div>

            {/* Hatched striped progress bars */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 w-3/4 rounded-full" />
              </div>
              <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-blue-300 to-indigo-400 w-1/2 rounded-full" />
              </div>
              <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-teal-300 to-emerald-400 w-4/5 rounded-full" />
              </div>
            </div>

            {/* Mini Summary Stats */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 pt-1">
              <span>15 genes</span>
              <span>6% change</span>
              <span>71 cells</span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <span className="font-heading font-black text-sm text-slate-900 tracking-tight">
                24–36 <span className="text-[10px] text-slate-500 font-normal">markers</span>
              </span>
              <span className="font-heading font-black text-sm text-slate-900 tracking-tight">
                11–13 <span className="text-[10px] text-slate-500 font-normal">variants</span>
              </span>
            </div>
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

        <PatientTable patients={recentPatients} />
      </section>

    </div>
  );
}

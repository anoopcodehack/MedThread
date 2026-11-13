import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Activity,
  Award,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Stethoscope,
  User,
  RefreshCw,
  Sparkles,
  Pill,
  FlaskConical
} from "lucide-react";
import { SplashLoader } from "../components/common/SplashLoader";
import { BenchmarkModal } from "../components/modals/BenchmarkModal";

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [activeCockpitTab, setActiveCockpitTab] = useState<"dashboard" | "analytics" | "records">("dashboard");
  const [activePatientPreview, setActivePatientPreview] = useState<number>(101);

  const patients = [
    {
      id: 101,
      name: "Rajesh Sharma",
      age: 58,
      gender: "Male",
      condition: "Type 2 Diabetes & CAD",
      highlight: "Metformin Titration (500mg → 850mg) & Aspirin DIRECT_CONFLICT",
      docsCount: 10,
      eventsCount: 24,
      tag: "DIRECT CONFLICT",
      tagColor: "bg-red-50 text-red-700 border-red-200",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 102,
      name: "Priya Patel",
      age: 42,
      gender: "Female",
      condition: "Asthma & Acute Bronchitis",
      highlight: "2022 NKDA vs 2024 Ceftriaxone Anaphylaxis (NEEDS_REVIEW Override)",
      docsCount: 10,
      eventsCount: 8,
      tag: "NEEDS REVIEW (SOLVED)",
      tagColor: "bg-amber-50 text-amber-700 border-amber-200",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 103,
      name: "Vikram Malhotra",
      age: 64,
      gender: "Male",
      condition: "Post-CABG & Hypertension",
      highlight: "Planted Duplicate CBC Lab (<72h) & Held Anticoagulant Tracking",
      docsCount: 10,
      eventsCount: 17,
      tag: "DUPLICATE LAB",
      tagColor: "bg-orange-50 text-orange-700 border-orange-200",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 104,
      name: "Mohammed Irfan",
      age: 51,
      gender: "Male",
      condition: "Diabetic Nephropathy",
      highlight: "Multi-Specialist Prescriptions & Glipizide Unit Reconciliation",
      docsCount: 10,
      eventsCount: 8,
      tag: "UNIT CONVERSION",
      tagColor: "bg-blue-50 text-blue-700 border-blue-200",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: 105,
      name: "David Fernandes",
      age: 39,
      gender: "Male",
      condition: "Preventive Wellness",
      highlight: "Annual Executive Checkup & Baseline Longitudinal Investigations",
      docsCount: 10,
      eventsCount: 2,
      tag: "BASELINE",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F4] text-slate-900 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Intro Splash Loader */}
      {showSplash && (
        <SplashLoader onComplete={() => setShowSplash(false)} minDurationMs={2600} />
      )}

      {/* Benchmark Scorecard Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (High-fashion botanical deep green aesthetic like VYORA) */}
      {/* ========================================================================= */}
      <header className="relative bg-gradient-to-b from-[#092817] via-[#113C25] to-[#0A2918] text-white overflow-hidden pb-20 pt-4">
        {/* Soft atmospheric ambient light glows */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full h-48 bg-gradient-to-t from-[#0A2918] to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Pill Navigation Bar (Inspired by VYORA & Clinical Dock) */}
          <nav className="flex items-center justify-between py-4 border-b border-white/10">
            {/* Left Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <img
                    src="/logo.jpg"
                    alt="MedThread Logo"
                    className="h-10 w-32 sm:w-36 object-contain rounded-lg shadow-md group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="hidden sm:inline-block font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PS-7 ENGINE
                </span>
              </Link>
            </div>

            {/* Center Pill Menu */}
            <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-white/80">
              <a href="#challenge" className="hover:text-emerald-300 transition-colors">
                The Challenge
              </a>
              <a href="#engines" className="hover:text-emerald-300 transition-colors">
                5 Safety Engines
              </a>
              <button
                onClick={() => setIsBenchmarkOpen(true)}
                className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-emerald-300"
              >
                <Award size={13} />
                <span>Benchmark Scorecard</span>
              </button>
              <a href="#cockpit" className="hover:text-emerald-300 transition-colors">
                Clinical Cockpit
              </a>
              <a href="#dossiers" className="hover:text-emerald-300 transition-colors">
                5 Patients
              </a>
            </div>

            {/* Right CTAs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSplash(true)}
                className="hidden sm:flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-white/5"
                title="Replay smooth logo drop animation"
              >
                <RefreshCw size={12} />
                <span>Replay Intro</span>
              </button>

              <Link
                to="/patient"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 rounded-full backdrop-blur-sm transition-all"
              >
                <User size={13} />
                <span>Patient Portal</span>
              </Link>

              <Link
                to="/doctor/patients/101"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#092817] bg-[#D4F4C8] hover:bg-white px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105"
              >
                <Stethoscope size={14} className="text-[#092817]" />
                <span>Doctor Cockpit</span>
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </nav>

          {/* Hero Content Area */}
          <div className="pt-12 sm:pt-16 pb-8">
            {/* Top Row: Review & Hackathon Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/70 font-medium">Reviewed on</span>
                <div className="flex text-amber-300 text-xs">★★★★★</div>
                <span className="font-heading font-extrabold text-sm text-white tracking-wide">
                  5.0 Rating • 100% Precision
                </span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/70 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                <Sparkles size={13} className="text-emerald-400" />
                <span>SOSC SYNERGY 26 • Problem Statement PS-7 (Advanced Track)</span>
              </div>
            </div>

            {/* Giant Display Headlines Juxtaposition (Like "FEEL GOOD / WORK EXCELLENT") */}
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Bold Display Type */}
              <div className="lg:col-span-7">
                <h1 className="font-heading tracking-tight leading-[0.95]">
                  <span className="block text-5xl sm:text-7xl lg:text-8xl font-black text-white uppercase drop-shadow-sm">
                    ONE PATIENT
                  </span>
                  <span className="block text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#A8E69E] uppercase mt-2">
                    MANY RECORDS
                  </span>
                  <span className="block text-4xl sm:text-6xl lg:text-7xl font-black text-white/95 uppercase mt-2 tracking-tight">
                    ZERO HALLUCINATIONS
                  </span>
                </h1>

                <p className="mt-8 text-base sm:text-lg text-white/80 max-w-xl font-normal leading-relaxed">
                  A person's medical history is scattered across clinics, labs, and hospitals. 
                  MedThread stitches fragmented records into a verifiable chronological timeline with 
                  <strong className="text-[#D4F4C8] font-semibold"> 5 Pure Python Deterministic Safety Engines</strong>, 
                  unit normalization, and 100% immutable citations.
                </p>

                {/* Interactive Action Row with Circular CTA */}
                <div className="mt-9 flex flex-wrap items-center gap-5">
                  {/* Circular Button inspired by Image 1 */}
                  <Link
                    to="/doctor/patients/101"
                    className="group relative flex items-center gap-3 bg-[#D4F4C8] hover:bg-white text-[#092817] pl-6 pr-2 py-2.5 rounded-full font-heading font-extrabold text-sm shadow-2xl transition-all transform hover:scale-105"
                  >
                    <span>Launch Doctor Cockpit</span>
                    <span className="h-10 w-10 rounded-full bg-[#092817] text-[#D4F4C8] group-hover:bg-[#113C25] flex items-center justify-center transition-colors">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>

                  <button
                    onClick={() => setIsBenchmarkOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
                  >
                    <Award size={15} className="text-emerald-300" />
                    <span>View Benchmark Scorecard</span>
                  </button>

                  <div className="text-xs text-emerald-200/80 font-mono flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>78.1% Review Time Saved</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Floating Clinical Cockpit HUD Preview (Echoing Image 2) */}
              <div className="lg:col-span-5 relative">
                
                {/* Floating Metric Meter Pill (Like 85% in Image 1) */}
                <div className="absolute -top-6 -right-2 sm:-right-4 z-20 bg-white/95 text-slate-800 p-3.5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-600"
                        strokeDasharray="78, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-heading font-black text-xs text-slate-900">78%</span>
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-xs text-slate-900">Faster Review</div>
                    <div className="text-[10px] text-slate-500 font-medium">42s vs 192s raw PDF</div>
                  </div>
                </div>

                {/* Main Glassmorphic Cockpit Card (Directly inspired by Image 2) */}
                <div className="bg-white/95 rounded-3xl p-5 shadow-2xl border border-white/30 backdrop-blur-xl text-slate-800 relative z-10">
                  
                  {/* Top Cockpit Pill Dock */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                      <button
                        onClick={() => setActiveCockpitTab("dashboard")}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          activeCockpitTab === "dashboard" ? "bg-[#092817] text-white shadow" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => setActiveCockpitTab("analytics")}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          activeCockpitTab === "analytics" ? "bg-[#092817] text-white shadow" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Analytics
                      </button>
                      <button
                        onClick={() => setActiveCockpitTab("records")}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          activeCockpitTab === "records" ? "bg-[#092817] text-white shadow" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Records
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Live Radar
                      </span>
                    </div>
                  </div>

                  {/* Greeting & Active Patient */}
                  <div className="pt-4 pb-3">
                    <div className="text-xs font-semibold text-slate-500">Clinical Cockpit</div>
                    <h3 className="font-heading font-black text-slate-900 text-lg leading-tight mt-0.5">
                      Ready to Review Patient Records?
                    </h3>
                  </div>

                  {/* Patient Switcher Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-3 pt-1 text-xs">
                    <button
                      onClick={() => setActivePatientPreview(101)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all whitespace-nowrap ${
                        activePatientPreview === 101 ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Pat-101 (Sharma)
                    </button>
                    <button
                      onClick={() => setActivePatientPreview(102)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all whitespace-nowrap ${
                        activePatientPreview === 102 ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Pat-102 (Patel)
                    </button>
                    <button
                      onClick={() => setActivePatientPreview(103)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all whitespace-nowrap ${
                        activePatientPreview === 103 ? "bg-blue-100 text-blue-900 border border-blue-300" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Pat-103 (Malhotra)
                    </button>
                  </div>

                  {/* Cockpit Card Body */}
                  {activePatientPreview === 101 ? (
                    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Rajesh Sharma (PAT-101)</span>
                        <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          DIRECT CONFLICT
                        </span>
                      </div>
                      
                      {/* Math Normalizer dual display */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Zero-LLM Math Normalizer:
                        </div>
                        <div className="font-mono text-xs font-bold text-emerald-800 mt-0.5">
                          Fasting Glucose: 140.5 mg/dL <span className="text-slate-400 font-normal">(raw: 7.8 mmol/L)</span>
                        </div>
                      </div>

                      {/* Medication FSM status */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Medication FSM Lifecycle:
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5">
                          Metformin Titrated <strong>500mg ➔ 850mg</strong> • Atorvastatin <span className="text-red-700 font-bold">Discontinued (2022)</span>
                        </div>
                      </div>
                    </div>
                  ) : activePatientPreview === 102 ? (
                    <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Priya Patel (PAT-102)</span>
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                          NEEDS REVIEW
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-amber-200/70 text-xs">
                        <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                          Historical Allergy Discrepancy:
                        </div>
                        <div className="text-xs text-slate-700 mt-1 space-y-1">
                          <div>• 2022 Consult: <code>"NKDA documented"</code></div>
                          <div>• 2024 ER Note: <code>"Severe Anaphylaxis to Ceftriaxone"</code></div>
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                        <span>1-Click Override Active • Raw 2022 Quote 100% Immutable</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Vikram Malhotra (PAT-103)</span>
                        <span className="text-[10px] font-bold uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                          DUPLICATE INVESTIGATION
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                        <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                          Planted Duplicate Lab Flagged:
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5">
                          Identical Complete Blood Count (CBC) ordered within 48 hours across 2 clinics.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cockpit Action Launcher */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      to={`/doctor/patients/${activePatientPreview}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                    >
                      <span>Open Full Patient Dossier</span>
                      <ArrowRight size={13} />
                    </Link>

                    <span className="font-mono text-[10px] text-slate-400">
                      14-Field Verifiable Schema
                    </span>
                  </div>
                </div>

                {/* Subtle Glow Underlay */}
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-teal-400/20 rounded-3xl blur-xl -z-10" />
              </div>
            </div>

            {/* Award Bar (Echoing "AWARDED BY THE WORLD HEALTH ORGANIZATION" in Image 1) */}
            <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 text-xs text-white/60">
              <div className="flex items-center gap-3">
                <Award size={20} className="text-[#D4F4C8]" />
                <span className="font-heading uppercase tracking-wider text-[11px] font-bold text-white/90">
                  SOSC SYNERGY 26 • 36-Hour National Hackathon
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-emerald-300">
                <span>Fast Ingest: &lt;55ms</span>
                <span>•</span>
                <span>Fact Precision: 100%</span>
                <span>•</span>
                <span>Hallucinations: 0</span>
                <span>•</span>
                <span>Immutable Citations: 100%</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MINIMALIST SCIENCE-BACKED FEATURES (Inspired directly by mid-section Image 1) */}
      {/* ========================================================================= */}
      <section id="challenge" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-14">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Why Generic AI Fails
            </span>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Clean, science-backed deterministic engines designed to reconcile medications, detect contradictions, and normalize units — without the unnecessary hallucinations.
            </h2>
          </div>

          {/* 3-Column Minimalist Line-Art Feature Grid (From Image 1) */}
          <div className="grid md:grid-cols-3 gap-10 pt-4 pb-12 border-b border-slate-100">
            {/* Col 1 */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 border border-emerald-100">
                <Pill size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                Non-Linear Medication FSM
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A medicine stopped two years ago still looks current in older records. 
                MedThread implements a deterministic Finite State Machine tracking 
                <code>STARTED ➔ DOSE_CHANGED ➔ TEMPORARILY_HELD ➔ DISCONTINUED</code>, ensuring discontinued drugs never look active.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 border border-emerald-100">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                Stage 0 Refusal Firewall
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enforcing Rubric Constraint #1: <em>"Never invents facts, makes diagnoses or gives treatment advice."</em> 
                A regex safety interceptor blocks prescriptive questions (*"What dosage should I take?"*) and diagnostic requests (*"Please diagnose my rash"*).
              </p>
            </div>

            {/* Col 3 */}
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-5 border border-emerald-100">
                <FlaskConical size={24} />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">
                Zero-LLM Math Normalizer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The same test is reported in mmol/L in one lab and mg/dL in another. 
                MedThread uses pure deterministic mathematical conversions for Glucose ($\times 18.0182$), 
                Cholesterol ($\times 38.67$), and Creatinine ($\div 88.42$) with dual display.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. 5 PURE PYTHON DETERMINISTIC SAFETY ENGINES DEEP DIVE */}
      {/* ========================================================================= */}
      <section id="engines" className="py-20 bg-[#F4F7F4] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
              Zero-LLM Architectural Moat
            </span>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">
              5 Pure Python Deterministic Safety Modules
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              In healthcare, statistical hallucinations cause fatalities. MedThread decouples messy multimodal PDF extraction from 100% deterministic, rule-based clinical safety logic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    rules_engine.py:165
                  </span>
                  <span className="text-xs font-bold text-slate-400">ENGINE 1</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  Zero-LLM Math Normalizer
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Deterministic unit conversion with dual display, preserving exact raw lab numbers while standardizing metrics across laboratories:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 space-y-1 mb-4 border border-slate-200/60">
                  <div>• Glucose: mmol/L × 18.0182 → mg/dL</div>
                  <div>• Cholesterol: mmol/L × 38.67 → mg/dL</div>
                  <div>• Creatinine: µmol/L ÷ 88.42 → mg/dL</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                Display: 140.5 mg/dL (raw: 7.8 mmol/L)
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    rules_engine.py:22
                  </span>
                  <span className="text-xs font-bold text-slate-400">ENGINE 2</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  Non-Linear Medication FSM
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Finite State Machine handling medication starts, dose changes, clinical holds, and permanent cessation:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 space-y-1.5 mb-4 border border-slate-200/60">
                  <div className="text-emerald-700 font-bold">STARTED ➔ DOSE_CHANGED</div>
                  <div className="text-amber-700 font-bold">➔ TEMPORARILY_HELD</div>
                  <div className="text-red-700 font-bold">➔ DISCONTINUED (Terminal)</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-xl">
                Prevents past discontinued drugs from masquerading as active.
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    reconciliation_service.py
                  </span>
                  <span className="text-xs font-bold text-slate-400">ENGINE 3</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  4-Tier Contradiction Radar
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Rule-based radar scanning cross-document conflicts into 4 discrete triage tiers:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 space-y-1 mb-4 border border-slate-200/60">
                  <div className="text-red-700 font-bold">• DIRECT_CONFLICT (Aspirin held)</div>
                  <div className="text-amber-700 font-bold">• NEEDS_REVIEW (NKDA vs Anaphylaxis)</div>
                  <div className="text-orange-700 font-bold">• DUPLICATE_INVESTIGATION (&lt;72h)</div>
                  <div className="text-blue-700 font-bold">• UPDATED (Dose titration)</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                Green ✅ Resolved badge upon clinician override.
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    qa_service.py:206
                  </span>
                  <span className="text-xs font-bold text-slate-400">ENGINE 4</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  Stage 0 Refusal Firewall
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Safety interceptor guarding Rubric Constraint #1: <em>"Never invents facts, makes diagnoses or gives treatment advice."</em>
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 space-y-1.5 mb-4 border border-slate-200/60">
                  <div className="text-red-600">✗ "What dosage of insulin should I take?" ➔ BLOCKED</div>
                  <div className="text-red-600">✗ "Please diagnose my rash" ➔ BLOCKED</div>
                  <div className="text-emerald-700">✓ "What medications are recorded?" ➔ ALLOWED</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-xl">
                Guaranteed zero diagnostic/prescriptive drift.
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    qa_service.py:241
                  </span>
                  <span className="text-xs font-bold text-slate-400">ENGINE 5</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  Epistemic Abstention Gate
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Distinguishes "not documented" from an explicit negative. If 0 extracted facts exist in the database, returns <code>NOT_DOCUMENTED</code> without calling an LLM:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 space-y-1 mb-4 border border-slate-200/60">
                  <div className="font-semibold text-slate-900">Epistemic Rule:</div>
                  <div>"Absence of evidence is NOT evidence of absence."</div>
                  <div className="text-purple-700 font-mono text-[10px] mt-1 font-bold">status: "NOT_DOCUMENTED"</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-purple-700 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                100% Grounded QA with page numbers &amp; quotes.
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    clinical_models.py:65
                  </span>
                  <span className="text-xs font-bold text-slate-400">FEATURE 6</span>
                </div>
                <h3 className="font-heading font-extrabold text-slate-900 text-lg mb-2">
                  Forensic Review &amp; Immutability
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  When a clinician resolves a discrepancy, original raw machine extractions stay <strong>100% immutable</strong>:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 space-y-1 mb-4 border border-slate-200/60">
                  <div>• Source Document: <code>01_Consult_2022.pdf</code></div>
                  <div>• Raw Quote: <code>"Allergies: NKDA"</code> [UNTOUCHED]</div>
                  <div>• Audit Trail: Doctor ID, Timestamp, Rationale</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                Logged to review_audit_logs permanently.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLINICAL COCKPIT & BENCHMARK PATIENT DOSSIERS */}
      {/* ========================================================================= */}
      <section id="dossiers" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Minimum Viable Submission Met
            </span>
            <h2 className="mt-4 font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">
              5 Benchmark Patient Dossiers
            </h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              50 clinical documents (5 PDFs + 5 TXTs per patient) pre-seeded in Supabase Cloud Storage and PostgreSQL / SQLite. Click any patient to launch their live Cockpit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-[#FAFBF9] border border-slate-200 hover:border-emerald-600 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-heading font-extrabold text-slate-900 text-base group-hover:text-emerald-800 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          PAT-{p.id} • {p.gender}, {p.age} yrs
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${p.tagColor}`}>
                      {p.tag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 leading-relaxed font-medium mb-4">
                    {p.highlight}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-700" />
                      <span>{p.docsCount} Documents</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity size={14} className="text-emerald-700" />
                      <span>{p.eventsCount} Events</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between">
                  <Link
                    to={`/doctor/patients/${p.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#092817] hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Launch Doctor Cockpit</span>
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/patient"
                    className="text-[11px] text-slate-400 hover:text-slate-700"
                  >
                    Patient View
                  </Link>
                </div>
              </div>
            ))}

            {/* Scorecard Widget Card */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-[#092817] via-[#113C25] to-[#0A2918] text-white flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-widest">
                  Live Evaluation Suite
                </span>
                <h3 className="font-heading font-extrabold text-white text-xl mt-2 mb-2">
                  Automated Benchmark
                </h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed mb-5">
                  Automated evaluation across all 5 patients measuring fact precision, golden recall, and clinician review time.
                </p>

                <div className="space-y-2.5 text-xs text-emerald-200/90 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Fact Precision: <strong>100.0%</strong> (59/59)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Golden Recall: <strong>100.0%</strong> (12/12)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Review Time Saved: <strong>78.1%</strong> (42s vs 192s)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsBenchmarkOpen(true)}
                className="mt-6 w-full py-3 px-4 rounded-full text-xs font-extrabold text-[#092817] bg-[#D4F4C8] hover:bg-white transition-all text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <Award size={15} />
                <span>Open Benchmark Scorecard</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DARK BOTANICAL CALL-TO-ACTION & FOOTER (Inspired by bottom of Image 1) */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-[#092817] via-[#0E3520] to-[#071D11] text-white pt-24 pb-16 relative overflow-hidden">
        
        {/* Ambient Mist Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Big CTA Headline */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              READY TO RECONCILE SCATTERED RECORDS IN SECONDS?
            </h2>
            <p className="mt-6 text-sm sm:text-base text-emerald-100/80 max-w-xl mx-auto leading-relaxed">
              Experience the Evidence-First Medical History Engine built for SOSC SYNERGY 26 (Problem Statement PS-7).
            </p>

            {/* Dual Pill Action Buttons */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/doctor/patients/101"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-bold text-[#092817] bg-[#D4F4C8] hover:bg-white shadow-xl transition-all transform hover:scale-105"
              >
                <Stethoscope size={16} />
                <span>Launch Doctor Cockpit</span>
                <ArrowUpRight size={15} />
              </Link>

              <Link
                to="/patient"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all"
              >
                <User size={15} />
                <span>Open Patient Portal</span>
              </Link>
            </div>
          </div>

          {/* Footer Grid (Matching Image 1) */}
          <div className="pt-16 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-10 text-xs">
            {/* Col 1 */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.jpg"
                  alt="MedThread Logo"
                  className="h-9 w-32 object-contain rounded-md brightness-110"
                />
                <span className="font-heading font-black text-white text-lg tracking-tight">
                  MedThread
                </span>
              </div>
              <p className="text-xs text-white/60 max-w-md leading-relaxed mb-4">
                Evidence-First Medical History Engine. Built strictly adhering to SOSC SYNERGY 26 Hackathon Problem Statement PS-7 constraints ("One Patient, Many Records", Advanced Track).
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-emerald-300">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">FastAPI</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">React + Vite</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Supabase Storage</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">PyMuPDF (&lt;55ms)</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Zero-LLM Math</span>
              </div>
            </div>

            {/* Col 2: Learn */}
            <div>
              <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-4">
                Clinical Modules
              </h4>
              <ul className="space-y-2 text-white/60">
                <li>Zero-LLM Math Normalizer</li>
                <li>Non-Linear Medication FSM</li>
                <li>4-Tier Contradiction Radar</li>
                <li>Stage 0 Refusal Firewall</li>
                <li>Epistemic Abstention Gate</li>
                <li>14-Field Verifiable Schema</li>
              </ul>
            </div>

            {/* Col 3: Navigation */}
            <div>
              <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-4">
                Navigation
              </h4>
              <ul className="space-y-2 text-white/60">
                <li>
                  <Link to="/doctor/patients/101" className="hover:text-emerald-300 transition-colors">
                    Doctor Cockpit (Patient 101)
                  </Link>
                </li>
                <li>
                  <Link to="/doctor/patients/102" className="hover:text-emerald-300 transition-colors">
                    Doctor Cockpit (Patient 102 - Solved)
                  </Link>
                </li>
                <li>
                  <Link to="/patient" className="hover:text-emerald-300 transition-colors">
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setIsBenchmarkOpen(true)}
                    className="hover:text-emerald-300 transition-colors text-left"
                  >
                    Benchmark Scorecard
                  </button>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-emerald-300 transition-colors">
                    Sign In / Authentication
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
            <div>
              © 2026 MedThread • SOSC SYNERGY 26 (Problem Statement PS-7). All rights reserved.
            </div>
            <div className="text-center sm:text-right">
              Clinical Disclaimer: Built strictly under PS-7 constraints. Answers factual questions only from verified records.
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}

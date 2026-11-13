import { useState, useRef } from "react";
import {
  Bell,
  UserRound,
  Award,
  LogOut,
  Users,
  QrCode,
  ShieldCheck,
  Hospital,
  Activity,
  FileSpreadsheet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import { BenchmarkModal } from "../modals/BenchmarkModal";

export default function DoctorHeader() {
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"patients" | "audit" | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  const handleMouseEnter = (menu: "patients" | "audit") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  const pathname = location.pathname;
  const isCockpitActive = pathname === "/doctor/dashboard" || pathname === "/doctor";
  const isPatientsActive =
    pathname.startsWith("/doctor/patients") ||
    pathname === "/doctor/recent-patients" ||
    pathname === "/doctor/scan";
  const isAuditActive = pathname === "/doctor/access-history";

  // Exactly ONE active dot indicator: hovered menu if open, otherwise active path
  const activeDot: "cockpit" | "patients" | "audit" | null =
    openDropdown === "patients"
      ? "patients"
      : openDropdown === "audit"
      ? "audit"
      : isCockpitActive
      ? "cockpit"
      : isPatientsActive
      ? "patients"
      : isAuditActive
      ? "audit"
      : null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl w-full mx-auto px-6 py-3.5 flex items-center justify-between gap-6 relative">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
              <BrandLogo theme="dark" size="md" showSubtitle />
            </Link>
          </div>

          {/* Center: Mega-Menu Top Navigation (No > or chevron symbols) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-700">
            {/* 1. Cockpit Direct Link */}
            <Link
              to="/doctor/dashboard"
              onClick={() => setOpenDropdown(null)}
              className={`transition flex flex-col items-center py-1 font-bold ${
                isCockpitActive
                  ? "text-forest"
                  : "text-slate-600 hover:text-forest"
              }`}
            >
              <span>Cockpit</span>
              {activeDot === "cockpit" && (
                <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
              )}
            </Link>

            {/* 2. Patients Mega-Menu Hover Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("patients")}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to="/doctor/recent-patients"
                className={`flex flex-col items-center py-1 font-bold transition ${
                  isPatientsActive || openDropdown === "patients"
                    ? "text-forest"
                    : "text-slate-600 hover:text-forest"
                }`}
              >
                <span>Patient Records</span>
                {activeDot === "patients" && (
                  <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
                )}
              </Link>

              {/* Mega-Menu Flyout (Clean 3-column Coder.com-style layout) */}
              {openDropdown === "patients" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[720px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("patients")}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Col 1: Spotlight (Left Column) */}
                  <div className="col-span-4 pr-3 border-r border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Clinical Dossier
                      </span>
                      <h4 className="font-heading font-extrabold text-sm text-slate-900 mt-2">
                        Patient Longitudinal Chart
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                        Synthesized records from 4 hospital networks with instant evidence citations.
                      </p>
                    </div>

                    <Link
                      to="/doctor/recent-patients"
                      onClick={() => setOpenDropdown(null)}
                      className="text-xs font-bold text-forest hover:underline mt-4 pt-2 border-t border-slate-100 text-left block"
                    >
                      View Active Patients
                    </Link>
                  </div>

                  {/* Col 2: Category Links (Middle Column) */}
                  <div className="col-span-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                      Clinical Operations
                    </span>

                    <Link
                      to="/doctor/recent-patients"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <Users size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Recent Patients
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Active clinical consultations
                        </span>
                      </div>
                    </Link>

                    <Link
                      to="/doctor/patients/101"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <FileSpreadsheet size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          Patient Chart (Rajesh)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Deep-dive verifiable records
                        </span>
                      </div>
                    </Link>

                    <Link
                      to="/doctor/scan"
                      onClick={() => setOpenDropdown(null)}
                      className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                        <QrCode size={14} />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                          QR &amp; Vitals Scanner
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Camera ingestion &amp; heart rate
                        </span>
                      </div>
                    </Link>
                  </div>

                  {/* Col 3: Visual Feature Card (Right Column - NO AI icons) */}
                  <div className="col-span-4 pl-3 border-l border-slate-100 flex flex-col justify-between">
                    <div className="rounded-xl bg-gradient-to-br from-[#0B2818] via-[#0E351F] to-[#082214] p-4 text-white flex flex-col justify-between h-full shadow-sm">
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                          <Hospital size={13} />
                          <span>NABH Quality Grounding</span>
                        </div>
                        <h5 className="font-heading font-extrabold text-xs text-white mt-2 leading-snug">
                          Deterministic Verification
                        </h5>
                        <p className="text-[11px] text-white/75 mt-1.5 leading-relaxed">
                          Replaces paper files with instantaneous clinical verification in under 60 seconds.
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-white/15 flex items-center justify-between text-[10px] font-semibold text-emerald-300">
                        <span>-78% Time Saved</span>
                        <span>DISHA Compliant</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Analytics & Audit Dropdown (No > or chevron) */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("audit")}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to="/doctor/access-history"
                className={`flex flex-col items-center py-1 font-bold transition ${
                  isAuditActive || openDropdown === "audit"
                    ? "text-forest"
                    : "text-slate-600 hover:text-forest"
                }`}
              >
                <span>Analytics &amp; Audit</span>
                {activeDot === "audit" && (
                  <span className="w-1.5 h-1.5 bg-forest rounded-xs mt-1 block" />
                )}
              </Link>

              {/* Audit Dropdown Flyout */}
              {openDropdown === "audit" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("audit")}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to="/doctor/access-history"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Access History &amp; Logs
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Immutable audit trail &amp; DISHA logs
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      setIsBenchmarkOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <Activity size={15} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-forest">
                        Clinical Performance Benchmark
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        78% consultation time efficiency
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Benchmark Trigger, Notifications, Doctor Avatar Only, Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsBenchmarkOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-forest border border-emerald-200 hover:bg-emerald-100 transition"
              title="Clinical Performance Benchmark Scorecard"
            >
              <Award className="h-3.5 w-3.5 text-forest" />
              <span>Benchmark (-78%)</span>
            </button>

            <button
              type="button"
              className="text-slate-500 hover:text-forest transition p-2 rounded-xl hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Doctor Profile Icon Only (Zero doctor name in navbar) */}
            <Link
              to="/doctor/profile"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition shadow-xs ${
                pathname === "/doctor/profile"
                  ? "bg-forest text-white border-forest ring-2 ring-forest/30"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
              }`}
              title="Open Doctor Profile"
              aria-label="Open Doctor Profile"
            >
              <UserRound size={17} />
            </Link>

            {/* Logout Button (Dark Green Pill Style from Landing Page) */}
            <Link
              to="/"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5"
              title="Logout from Doctor Workspace"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Sub-Navigation Scroll Strip */}
        <div className="md:hidden border-t border-slate-100 bg-[#F8FAF7] px-4 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-2 text-xs font-bold min-w-max">
            <Link
              to="/doctor/dashboard"
              className={`px-3 py-1.5 rounded-xl transition ${
                isCockpitActive ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Cockpit
            </Link>
            <Link
              to="/doctor/recent-patients"
              className={`px-3 py-1.5 rounded-xl transition ${
                pathname === "/doctor/recent-patients" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Recent Patients
            </Link>
            <Link
              to="/doctor/patients/101"
              className={`px-3 py-1.5 rounded-xl transition ${
                pathname.startsWith("/doctor/patients") ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Patient Chart
            </Link>
            <Link
              to="/doctor/scan"
              className={`px-3 py-1.5 rounded-xl transition ${
                pathname === "/doctor/scan" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Vitals &amp; QR
            </Link>
            <Link
              to="/doctor/access-history"
              className={`px-3 py-1.5 rounded-xl transition ${
                pathname === "/doctor/access-history" ? "bg-forest text-white" : "text-slate-600"
              }`}
            >
              Audit Logs
            </Link>
          </nav>
        </div>
      </header>

      {/* Backdrop Dimmer on Mega-Menu Open (Smooth Coder.com-style blur) */}
      {openDropdown && (
        <div
          className="fixed inset-0 top-[60px] bg-slate-900/10 backdrop-blur-xs z-30 pointer-events-none transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </>
  );
}

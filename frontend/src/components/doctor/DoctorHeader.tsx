import { useState, useRef } from "react";
import {
  Bell,
  UserRound,
  Award,
  LogOut,
  Users,
  QrCode,
  ShieldCheck,
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
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#7B9E91] via-[#8AAFA2] to-[#7B9E91] text-white backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl w-full mx-auto px-6 py-3.5 flex items-center justify-between gap-6 relative">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
              <BrandLogo theme="light" size="md" showSubtitle />
            </Link>
          </div>

          {/* Center: Mega-Menu Top Navigation (No > or chevron symbols) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-white/90">
            {/* 1. Cockpit Direct Link */}
            <Link
              to="/doctor/dashboard"
              onClick={() => setOpenDropdown(null)}
              className={`transition flex flex-col items-center py-1 font-bold ${
                isCockpitActive
                  ? "text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span>Cockpit</span>
              {activeDot === "cockpit" && (
                <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
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
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Patient Records</span>
                {activeDot === "patients" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
                )}
              </Link>

              {/* Patient Records Dropdown Flyout */}
              {openDropdown === "patients" && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-left"
                  onMouseEnter={() => handleMouseEnter("patients")}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    to="/doctor/recent-patients"
                    onClick={() => setOpenDropdown(null)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <Users size={15} />
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <FileSpreadsheet size={15} />
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-slate-800 transition group text-left"
                  >
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 group-hover:bg-forest group-hover:text-white transition">
                      <QrCode size={15} />
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
                    ? "text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span>Analytics &amp; Audit</span>
                {activeDot === "audit" && (
                  <span className="w-1.5 h-1.5 bg-white rounded-xs mt-1 block shadow-xs" />
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 hover:bg-white/30 transition shadow-xs"
              title="Clinical Performance Benchmark Scorecard"
            >
              <Award className="h-3.5 w-3.5 text-white" />
              <span>Benchmark (-78%)</span>
            </button>

            <button
              type="button"
              className="text-white/90 hover:text-white transition p-2 rounded-xl hover:bg-white/15"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Doctor Profile Icon Only (Zero doctor name in navbar) */}
            <Link
              to="/doctor/profile"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition shadow-xs ${
                pathname === "/doctor/profile"
                  ? "bg-white text-[#0A2A18] border-white ring-2 ring-white/40"
                  : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
              }`}
              title="Open Doctor Profile"
              aria-label="Open Doctor Profile"
            >
              <UserRound size={17} />
            </Link>

            {/* Logout Button (Dark Green Pill Style from Landing Page) */}
            <Link
              to="/"
              className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5 border border-white/20"
              title="Logout from Doctor Workspace"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>

        {/* Mobile/Tablet Sub-Navigation Scroll Strip */}
        <div className="md:hidden border-t border-white/15 bg-[#789B8E] px-4 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-2 text-xs font-bold min-w-max text-white">
            <Link
              to="/doctor/dashboard"
              className={`px-3 py-1.5 rounded-xl transition ${
                isCockpitActive ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
              }`}
            >
              Cockpit
            </Link>
            <Link
              to="/doctor/recent-patients"
              className={`px-3 py-1.5 rounded-xl transition ${
                pathname === "/doctor/recent-patients" ? "bg-white text-[#0A2A18]" : "text-white/80 hover:text-white"
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

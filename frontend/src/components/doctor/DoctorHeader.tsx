import { useState, useRef, useEffect } from "react";
import {
  Bell,
  UserRound,
  LogOut,
  Users,
  QrCode,
  ShieldCheck,
  Activity,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import { BenchmarkModal } from "../modals/BenchmarkModal";

export default function DoctorHeader() {
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"patients" | "audit" | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasAlert, setHasAlert] = useState<boolean>(() => {
    try {
      const readStatus = localStorage.getItem("medthread_emergency_notif_read");
      if (readStatus === "true") return false;
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.isRead || parsed.isApproved || parsed.isDismissed) return false;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
  const [alertSummary, setAlertSummary] = useState<{
    doctor: string;
    patientName: string;
    token: string;
    isRevoked?: boolean;
    isApproved?: boolean;
  }>({
    doctor: "Dr. Suresh Menon, MD",
    patientName: "Rajesh Sharma (PAT-101)",
    token: "MT-ER-948271",
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const markAsRead = () => {
    setHasAlert(false);
    try {
      localStorage.setItem("medthread_emergency_notif_read", "true");
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isRead = true;
        parsed.isApproved = true;
        localStorage.setItem("medthread_emergency_dispatch", JSON.stringify(parsed));
      }
      window.dispatchEvent(new CustomEvent("medthread_emergency_read"));
      if (bcRef.current) {
        bcRef.current.postMessage({ type: "EMERGENCY_READ" });
      }
    } catch {}
  };

  useEffect(() => {
    // Check initial stored emergency referral
    try {
      const readStatus = localStorage.getItem("medthread_emergency_notif_read");
      const stored = localStorage.getItem("medthread_emergency_dispatch");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlertSummary({
          doctor: parsed.doctor || "Dr. Suresh Menon, MD",
          patientName: "Rajesh Sharma (PAT-101)",
          token: parsed.token || "MT-ER-948271",
          isRevoked: parsed.isRevoked,
          isApproved: parsed.isApproved,
        });
        if (readStatus === "true" || parsed.isRead || parsed.isApproved || parsed.isDismissed) {
          setHasAlert(false);
        } else {
          setHasAlert(true);
        }
      } else {
        if (readStatus === "true") {
          setHasAlert(false);
        }
      }
    } catch {}

    const handleEmergency = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      if (customEvent.detail) {
        setAlertSummary({
          doctor: customEvent.detail.doctor || "Dr. Suresh Menon, MD",
          patientName: "Rajesh Sharma (PAT-101)",
          token: customEvent.detail.token || "MT-ER-948271",
          isRevoked: false,
          isApproved: false,
        });
        localStorage.removeItem("medthread_emergency_notif_read");
        setHasAlert(true);
      }
    };

    const handleRevoked = () => {
      setAlertSummary((prev) => ({ ...prev, isRevoked: true }));
    };

    const handleEmergencyRead = () => {
      setHasAlert(false);
    };

    window.addEventListener("medthread_emergency_dispatched", handleEmergency);
    window.addEventListener("medthread_access_revoked", handleRevoked);
    window.addEventListener("medthread_emergency_read", handleEmergencyRead);

    try {
      const bc = new BroadcastChannel("medthread_live_notifications");
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data?.type === "EMERGENCY_DISPATCH") {
          localStorage.removeItem("medthread_emergency_notif_read");
          setHasAlert(true);
        } else if (ev.data?.type === "EMERGENCY_READ") {
          setHasAlert(false);
        } else if (ev.data?.type === "ACCESS_REVOKED") {
          setAlertSummary((prev) => ({ ...prev, isRevoked: true }));
        }
      };
    } catch {}

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("medthread_emergency_dispatched", handleEmergency);
      window.removeEventListener("medthread_access_revoked", handleRevoked);
      window.removeEventListener("medthread_emergency_read", handleEmergencyRead);
      document.removeEventListener("mousedown", handleClickOutside);
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, []);

  const triggerShakeAndNavigate = () => {
    markAsRead(); // Instantly clear red dot upon clicking notification item
    setIsNotifOpen(false);
    if (pathname !== "/doctor/dashboard" && pathname !== "/doctor") {
      navigate("/doctor/dashboard");
    }
    // Dispatch highlight event to shake and scroll the referral banner
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("medthread_highlight_referral"));
    }, 120);
  };

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

          {/* Right: Emergency Notifications, Doctor Avatar, Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Interactive Emergency Dispatch Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  // If on dashboard, clicking the bell directly shakes the banner!
                  if (pathname === "/doctor/dashboard" || pathname === "/doctor") {
                    window.dispatchEvent(new CustomEvent("medthread_highlight_referral"));
                  }
                }}
                className="relative text-white/90 hover:text-white transition p-2 rounded-xl hover:bg-white/15 cursor-pointer"
                aria-label="Emergency Notifications"
                title={hasAlert ? "New Emergency Specialist Dispatch" : "Notifications"}
              >
                <Bell size={18} />
                {hasAlert && (
                  <>
                    <span className="animate-ping absolute top-1.5 right-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-xs">
                      1
                    </span>
                  </>
                )}
              </button>

              {/* Notification Dropdown Flyout */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell size={13} className="text-rose-600" />
                      Emergency Dispatch Alerts
                    </span>
                    <div className="flex items-center gap-2">
                      {hasAlert && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead();
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasAlert ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                        {hasAlert ? "1 Active" : "0 New"}
                      </span>
                    </div>
                  </div>

                  {hasAlert ? (
                    <button
                      type="button"
                      onClick={triggerShakeAndNavigate}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 transition group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {alertSummary.isRevoked ? "ACCESS REVOKED" : "SPECIALIST DISPATCH"}
                        </span>
                        <span className="font-mono text-slate-400">Just now</span>
                      </div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-forest mt-1">
                        {alertSummary.patientName}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {alertSummary.isRevoked
                          ? "Access token was revoked by the patient."
                          : `Routed to ${alertSummary.doctor} · Cardiac Prophylaxis Risk`}
                      </div>
                      <div className="text-[10px] font-bold text-forest mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span>Click to highlight &amp; focus on Cockpit</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No active emergency alerts
                    </div>
                  )}
                </div>
              )}
            </div>

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

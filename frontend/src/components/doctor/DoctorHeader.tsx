import { Bell, Menu, UserRound, Award, LayoutDashboard, BarChart2, Activity, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { getDoctorProfile } from "../../services/doctorService";
import { BenchmarkModal } from "../modals/BenchmarkModal";
import type { DoctorProfile } from "../../types/doctor";

export default function DoctorHeader() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  useEffect(() => {
    void getDoctorProfile().then(setProfile);

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<DoctorProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        void getDoctorProfile().then(setProfile);
      }
    };

    window.addEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("medthread_doctor_profile_updated", handleProfileUpdate);
    };
  }, []);

  const doctorName = profile?.name || "Dr. Ananya Rao";

  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-5 py-3 sm:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button type="button" className="text-muted lg:hidden" aria-label="Open navigation">
          <Menu size={22} />
        </button>
        <div className="hidden lg:block">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Doctor workspace</p>
          <p className="font-heading text-base font-bold text-slate-900">Evidence-First Care</p>
        </div>
      </div>

      {/* Center Pill Navigation matching Reference UI */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
        <NavLink
          to="/doctor/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`
          }
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/doctor/access-history"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`
          }
        >
          <BarChart2 size={14} />
          <span>Analytics</span>
        </NavLink>
        <NavLink
          to="/doctor/scan"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`
          }
        >
          <Activity size={14} />
          <span>Heart Rate</span>
        </NavLink>
        <NavLink
          to="/doctor/recent-patients"
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`
          }
        >
          <FileText size={14} />
          <span>Records</span>
        </NavLink>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={() => setIsBenchmarkOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 shadow-xs transition"
          title="Clinical Performance Benchmark Scorecard"
        >
          <Award className="h-4 w-4 text-emerald-600" />
          <span>Benchmark Scorecard (-78% Time)</span>
        </button>
        <button type="button" className="text-muted" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <Link
          to="/doctor/profile"
          className="flex items-center gap-2 text-sm font-semibold text-forest transition hover:opacity-85"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage">
            <UserRound size={18} />
          </span>
          <span className="hidden sm:inline">{doctorName}</span>
        </Link>
      </div>

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </header>
  );
}

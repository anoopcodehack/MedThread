import {
  Bell,
  UserRound,
  Award,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import { BenchmarkModal } from "../modals/BenchmarkModal";

export default function DoctorHeader() {
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#8AAFA2] via-[#9ABCAE] to-[#8AAFA2] text-white shadow-md border-b border-white/20 backdrop-blur-md">
      {/* Exact Landing Page Style Top Navbar for Doctor */}
      <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Brand Logo (Exact Landing Page Logo) */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
            <BrandLogo theme="light" size="md" />
          </Link>
        </div>

        {/* Center: Navigation Links in Exact Landing Page Uppercase Style */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wider text-white/90 uppercase">
          <NavLink
            to="/doctor/dashboard"
            className={({ isActive }) =>
              `transition pb-0.5 uppercase tracking-wider ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/80 hover:text-white"
              }`
            }
          >
            Clinical Cockpit
          </NavLink>

          <NavLink
            to="/doctor/access-history"
            className={({ isActive }) =>
              `transition pb-0.5 uppercase tracking-wider ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/80 hover:text-white"
              }`
            }
          >
            Analytics &amp; History
          </NavLink>

          <NavLink
            to="/doctor/scan"
            className={({ isActive }) =>
              `transition pb-0.5 uppercase tracking-wider ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/80 hover:text-white"
              }`
            }
          >
            Heart Rate &amp; Vitals
          </NavLink>

          <NavLink
            to="/doctor/recent-patients"
            className={({ isActive }) =>
              `transition pb-0.5 uppercase tracking-wider ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/80 hover:text-white"
              }`
            }
          >
            Patient Records
          </NavLink>
        </nav>

        {/* Right: Benchmark Scorecard, Safety Pill, Doctor Avatar, Logout */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsBenchmarkOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 hover:bg-white/25 transition"
            title="Clinical Performance Benchmark Scorecard"
          >
            <Award className="h-3.5 w-3.5 text-emerald-300" />
            <span>Benchmark (-78% Time)</span>
          </button>

          <button
            type="button"
            className="text-white/80 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          {/* Doctor Profile Icon Only (Zero doctor name in navbar) */}
          <Link
            to="/doctor/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white transition shadow-xs"
            title="Doctor Profile"
          >
            <UserRound size={16} />
          </Link>

          {/* Logout Button (Exact Landing Page 'Get Started' Dark Green Button Style) */}
          <Link
            to="/"
            className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5"
            title="Logout from Doctor Workspace"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </Link>
        </div>
      </div>

      {/* Mobile/Tablet Sub-Navigation Scroll Strip */}
      <div className="lg:hidden border-t border-white/15 bg-black/10 px-4 py-2 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-3 text-xs uppercase tracking-wider min-w-max">
          <NavLink
            to="/doctor/dashboard"
            className={({ isActive }) =>
              `transition pb-0.5 ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/70 hover:text-white"
              }`
            }
          >
            Cockpit
          </NavLink>
          <NavLink
            to="/doctor/access-history"
            className={({ isActive }) =>
              `transition pb-0.5 ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/70 hover:text-white"
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/doctor/scan"
            className={({ isActive }) =>
              `transition pb-0.5 ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/70 hover:text-white"
              }`
            }
          >
            Vitals
          </NavLink>
          <NavLink
            to="/doctor/recent-patients"
            className={({ isActive }) =>
              `transition pb-0.5 ${
                isActive
                  ? "text-white border-b-2 border-white font-bold"
                  : "text-white/70 hover:text-white"
              }`
            }
          >
            Records
          </NavLink>
        </nav>
      </div>

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </header>
  );
}

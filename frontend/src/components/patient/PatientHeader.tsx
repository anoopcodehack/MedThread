import {
  UserRound,
  LogOut,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../common/BrandLogo";
import type { PatientPage } from "./PatientSidebar";

interface Props {
  title?: string;
  patientName?: string;
  patientExternalId?: string;
  activePage?: PatientPage;
  onNavigate?: (page: PatientPage) => void;
}

const navTabs: { id: PatientPage; label: string }[] = [
  { id: "dashboard", label: "Overview" },
  { id: "history", label: "Medical History" },
  { id: "conditions", label: "Conditions" },
  { id: "medications", label: "Medications" },
  { id: "investigations", label: "Tests & Labs" },
  { id: "visits", label: "Visits" },
  { id: "documents", label: "Documents" },
  { id: "access", label: "Emergency Access" },
];

export default function PatientHeader({
  activePage = "dashboard",
  onNavigate,
}: Props) {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#8AAFA2] via-[#9ABCAE] to-[#8AAFA2] text-white shadow-md border-b border-white/20 backdrop-blur-md">
      {/* Exact Landing Page Style Top Navbar */}
      <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: Brand Logo (Exact Landing Page Logo) */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group" title="Return to MedThread Home">
            <BrandLogo theme="light" size="md" />
          </Link>
        </div>

        {/* Center: Navigation Links in Exact Landing Page Uppercase Style */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold tracking-wider text-white/90 uppercase">
          {navTabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate?.(tab.id)}
                className={`transition pb-0.5 uppercase tracking-wider ${
                  isActive
                    ? "text-white border-b-2 border-white font-bold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Notifications, User Icon & Logout Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-white/80 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell size={17} />
          </button>

          {/* User Profile Icon Only: Click to open Profile */}
          <button
            type="button"
            onClick={() => onNavigate?.("profile")}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition shadow-xs ${
              activePage === "profile"
                ? "bg-white text-forest border-white ring-2 ring-white/50"
                : "bg-white/15 hover:bg-white/25 border-white/30 text-white"
            }`}
            title="Profile & Caregivers"
            aria-label="Open Profile & Caregivers"
          >
            <UserRound size={16} />
          </button>

          {/* Logout Button (Exact Landing Page 'Get Started' Dark Green Button Style) */}
          <Link
            to="/"
            className="bg-[#0A2A18] hover:bg-[#124227] text-white text-xs font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-lg transition-all transform hover:scale-105 uppercase tracking-wider flex items-center gap-1.5"
            title="Logout from Patient Portal"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </Link>
        </div>
      </div>

      {/* Mobile/Tablet Sub-Navigation Scroll Strip */}
      <div className="lg:hidden border-t border-white/15 bg-black/10 px-4 py-2 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-3 text-xs uppercase tracking-wider min-w-max">
          {navTabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate?.(tab.id)}
                className={`transition pb-0.5 ${
                  isActive
                    ? "text-white border-b-2 border-white font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

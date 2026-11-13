import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

interface PlatformFooterProps {
  currentRole?: "patient" | "doctor";
  onNavigate?: (page: string) => void;
}

export const PlatformFooter: React.FC<PlatformFooterProps> = ({
  currentRole = "patient",
  onNavigate,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePatientNav = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    scrollToTop();
  };

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#0B2818] via-[#082214] to-[#04140B] text-white py-6 border-t border-emerald-950/40">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* One Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            onClick={scrollToTop}
            className="flex items-center gap-2 group"
            title="Return to MedThread Home"
          >
            <BrandLogo theme="light" size="sm" showSubtitle />
          </Link>
        </div>

        {/* Only 4 Names in line (matching navbar exactly) */}
        {currentRole === "patient" ? (
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-white/80">
            <button
              type="button"
              onClick={() => handlePatientNav("dashboard")}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handlePatientNav("history")}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Clinical Records
            </button>
            <button
              type="button"
              onClick={() => handlePatientNav("documents")}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => handlePatientNav("access")}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Emergency Access
            </button>
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-semibold text-white/80">
            <Link
              to="/doctor/dashboard"
              onClick={scrollToTop}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Cockpit
            </Link>
            <Link
              to="/doctor/recent-patients"
              onClick={scrollToTop}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Patient Records
            </Link>
            <Link
              to="/doctor/access-history"
              onClick={scrollToTop}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Audit &amp; Logs
            </Link>
            <Link
              to="/doctor/benchmarks"
              onClick={scrollToTop}
              className="hover:text-emerald-300 transition cursor-pointer"
            >
              Clinical Benchmarks
            </Link>
          </nav>
        )}

        {/* Clean copyright */}
        <div className="text-[11px] text-white/40">
          © 2026 MedThread Health
        </div>
      </div>
    </footer>
  );
};

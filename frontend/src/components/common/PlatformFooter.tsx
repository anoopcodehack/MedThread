import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowUp, Instagram, Twitter, Linkedin, Facebook } from "lucide-react";
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
    <footer className="mt-20 bg-gradient-to-b from-[#0B2818] via-[#082214] to-[#04140B] text-white pt-16 pb-12 overflow-hidden relative border-t border-emerald-950/40">
      {/* Soft Ambient Green Light Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main 3-Column Symmetrical Layout (Matching Landing Page Footer Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          {/* Column 1: One Logo & Clean Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link
              to="/"
              onClick={scrollToTop}
              className="inline-block group"
              title="Return to MedThread Home"
            >
              <BrandLogo theme="light" size="md" showSubtitle />
            </Link>
            <p className="mt-3 text-xs text-white/60 max-w-xs leading-relaxed">
              Clean, science-backed medical intelligence designed for everyday wellness and verifiable health history.
            </p>
          </div>

          {/* Column 2: Centerpiece Luxury Bottle Mockup on Grassy Meadow Mound */}
          <div className="flex flex-col items-center justify-end relative pt-2 -mb-6">
            {/* Ambient green glow behind bottle */}
            <div className="absolute top-8 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Upright Realistic Luxury Medicine Bottle */}
            <div className="relative z-10 w-32 sm:w-36 h-48 bg-gradient-to-r from-[#17221C] via-[#2A372E] to-[#141E18] rounded-[24px] shadow-2xl border border-white/15 p-3 flex flex-col justify-between text-center overflow-hidden">
              {/* Specular bottle light reflection line */}
              <div className="absolute top-0 bottom-0 left-2.5 w-4 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Silver/Bronze Metallic Screw Cap */}
              <div className="mx-auto w-16 h-6 bg-gradient-to-b from-[#8C7456] via-[#BFA47E] to-[#705A3D] rounded-t-lg shadow-inner border-t border-white/30" />

              {/* Bottle Label */}
              <div className="py-2 px-1 flex flex-col items-center">
                <span className="font-heading font-black tracking-[2.5px] text-[11px] text-white uppercase">
                  MEDTHREAD
                </span>
                <span className="text-[6px] tracking-[1.5px] text-white/70 uppercase mt-0.5">
                  CLINICAL HEALTH ENGINE
                </span>

                <div className="my-2 w-6 h-px bg-white/25" />

                <span className="text-[7.5px] font-bold text-white uppercase tracking-wider">
                  DAILY MULTIVITAMIN
                </span>
                <span className="text-[5.5px] text-white/60 tracking-widest uppercase mt-0.5">
                  ENERGY • IMMUNITY • CLARITY
                </span>
              </div>

              {/* Bottle Base */}
              <div className="text-[6px] tracking-widest text-white/40 uppercase pb-0.5">
                60 CAPSULES • VERIFIED
              </div>
            </div>

            {/* Scattered Floating Capsules */}
            <div className="absolute -left-3 top-20 w-6 h-3 rounded-full bg-gradient-to-r from-[#205C38] to-[#123822] shadow-lg border border-white/20 transform -rotate-45" />
            <div className="absolute -left-5 bottom-8 w-7 h-3.5 rounded-full bg-gradient-to-r from-[#A86F4C] to-[#6E4228] shadow-lg border border-white/20 transform rotate-12" />
            <div className="absolute -right-3 top-24 w-6 h-3 rounded-full bg-gradient-to-r from-[#205C38] to-[#123822] shadow-lg border border-white/20 transform rotate-45" />
            <div className="absolute -right-5 bottom-7 w-7 h-3.5 rounded-full bg-gradient-to-r from-[#2A6B42] to-[#123822] shadow-lg border border-white/20 transform -rotate-20" />

            {/* Grassy Meadow Dome Mound at Base */}
            <div className="w-44 sm:w-48 h-12 -mt-5 bg-gradient-to-t from-[#0A2214] via-[#163D23] to-[#255C35] rounded-t-full shadow-2xl border-t border-emerald-400/30 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400/25 via-transparent to-transparent" />
            </div>
          </div>

          {/* Column 3: The 4 Navbar Names Only */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
              NAVIGATION
            </h4>
            
            {currentRole === "patient" ? (
              <ul className="space-y-2.5 text-xs text-white/70">
                <li className="group">
                  <button
                    type="button"
                    onClick={() => handlePatientNav("dashboard")}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Overview</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </button>
                </li>
                <li className="group">
                  <button
                    type="button"
                    onClick={() => handlePatientNav("history")}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Clinical Records</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </button>
                </li>
                <li className="group">
                  <button
                    type="button"
                    onClick={() => handlePatientNav("documents")}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Documents</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </button>
                </li>
                <li className="group">
                  <button
                    type="button"
                    onClick={() => handlePatientNav("access")}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Emergency Access</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2.5 text-xs text-white/70">
                <li className="group">
                  <Link
                    to="/doctor/dashboard"
                    onClick={scrollToTop}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Cockpit</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </Link>
                </li>
                <li className="group">
                  <Link
                    to="/doctor/recent-patients"
                    onClick={scrollToTop}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Patient Records</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </Link>
                </li>
                <li className="group">
                  <Link
                    to="/doctor/access-history"
                    onClick={scrollToTop}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Audit &amp; Logs</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </Link>
                </li>
                <li className="group">
                  <Link
                    to="/doctor/benchmarks"
                    onClick={scrollToTop}
                    className="transition-all duration-200 hover:translate-x-2 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <span>Clinical Benchmarks</span>
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#A3C4AE]" />
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-white/50">
          <p>© 2026 MedThread Health Technologies, Inc. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-white/70">
              <span className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <Instagram size={11} />
              </span>
              <span className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <Twitter size={11} />
              </span>
              <span className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <Linkedin size={11} />
              </span>
              <span className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <Facebook size={11} />
              </span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="ml-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Back to Top"
            >
              <ArrowUp size={11} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

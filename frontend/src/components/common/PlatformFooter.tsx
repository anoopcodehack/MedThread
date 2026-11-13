import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Star,
  Activity,
  FileCheck2,
  Lock,
  ArrowUp,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

interface PlatformFooterProps {
  currentRole?: "patient" | "doctor";
}

export const PlatformFooter: React.FC<PlatformFooterProps> = ({
  currentRole = "patient",
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#0B2818] via-[#082214] to-[#04140B] text-white pt-14 pb-12 overflow-hidden relative border-t border-emerald-950/40">
      {/* Soft Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-10">
        {/* Top Assurance Banner */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.07] transition duration-200">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-sm sm:text-base text-white tracking-wide">
                  MedThread Evidence-First Clinical Safety
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  5.0 Safety Score
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 max-w-xl">
                Every extracted medication, lab finding, and allergy is deterministically grounded with immutable source passage citations and multi-tenant patient isolation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 hover:bg-white/15 transition">
              <Lock size={13} className="text-emerald-400" />
              <span>HIPAA &amp; DISHA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 hover:bg-white/15 transition">
              <Activity size={13} className="text-emerald-400" />
              <span>256-Bit Encryption</span>
            </div>
          </div>
        </div>

        {/* 4 Navigation Columns with in-place hover highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs pt-4 border-t border-white/10">
          {/* Column 1: Brand & Clinical Philosophy */}
          <div>
            <div className="mb-3">
              <BrandLogo theme="light" size="sm" showSubtitle />
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              Clean, science-backed medical intelligence designed for everyday wellness, multi-hospital synthesis, and verifiable health records without the paperwork burden.
            </p>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <Star size={11} fill="currentColor" />
              <span className="ml-1 text-white/80">Clinical Rating 5.0</span>
            </div>
          </div>

          {/* Column 2: Platform Capabilities (Hover stays right in place with subtle emerald glow) */}
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
              Clinical Platform
            </h4>
            <ul className="space-y-1.5 text-white/70">
              <li className="group p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition flex items-center justify-between cursor-default">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Unified Longitudinal Timeline</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 group-hover:text-emerald-300 transition">
                  Verified
                </span>
              </li>
              <li className="group p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition flex items-center justify-between cursor-default">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Multi-Hospital Stitching</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 group-hover:text-emerald-300 transition">
                  4 Networks
                </span>
              </li>
              <li className="group p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition flex items-center justify-between cursor-default">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Active vs Held Meds</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 group-hover:text-emerald-300 transition">
                  Safety Check
                </span>
              </li>
              <li className="group p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition flex items-center justify-between cursor-default">
                <div className="flex items-center gap-2">
                  <FileCheck2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Optical Camera Scanner</span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 group-hover:text-emerald-300 transition">
                  OCR Engine
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Workspaces & Access */}
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
              Workspaces &amp; Navigation
            </h4>
            <ul className="space-y-1.5 text-white/70">
              <li>
                <Link
                  to="/"
                  className="block p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                >
                  MedThread Home Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/patient"
                  className={`block p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition ${
                    currentRole === "patient" ? "text-emerald-300 font-bold bg-white/5" : ""
                  }`}
                >
                  Patient Health Workspace
                </Link>
              </li>
              <li>
                <Link
                  to="/doctor"
                  className={`block p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition ${
                    currentRole === "doctor" ? "text-emerald-300 font-bold bg-white/5" : ""
                  }`}
                >
                  Doctor Clinical Cockpit
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="block p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                >
                  Provider &amp; Patient Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Compliance & Security */}
          <div>
            <h4 className="font-heading font-bold uppercase tracking-widest text-white text-[11px] mb-3">
              Security &amp; Standards
            </h4>
            <ul className="space-y-1.5 text-white/70">
              <li className="p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
                HIPAA &amp; DISHA Data Isolation
              </li>
              <li className="p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
                Row-Level Security (RLS) Enforced
              </li>
              <li className="p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
                Cloud Supabase PostgreSQL Engine
              </li>
              <li className="p-1.5 -mx-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
                Zero-Knowledge Audit Trail
              </li>
            </ul>

            <div className="flex items-center gap-3 text-white/80 mt-4">
              <a
                href="#instagram"
                aria-label="Instagram"
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition hover:scale-110"
              >
                <Instagram size={13} />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition hover:scale-110"
              >
                <Twitter size={13} />
              </a>
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition hover:scale-110"
              >
                <Linkedin size={13} />
              </a>
              <a
                href="#facebook"
                aria-label="Facebook"
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition hover:scale-110"
              >
                <Facebook size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/40">
          <p>© 2026 MedThread Health Technologies, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white/70 transition cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-white/70 transition cursor-pointer">Terms of Service</span>
            <span>•</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
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

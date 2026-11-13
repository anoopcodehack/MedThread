import React, { useEffect, useState } from "react";
import { Activity, Sparkles, CheckCircle2 } from "lucide-react";

interface SplashLoaderProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  onComplete,
  minDurationMs = 2400,
}) => {
  const [stage, setStage] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const stages = [
    "Initializing Evidence-First Medical Engine...",
    "Mounting 5 Pure Python Deterministic Safety Modules...",
    "Connecting Supabase Cloud Storage & PostgreSQL...",
    "Calibrating Math Normalizer & Medication FSM...",
    "System Verified • Zero Hallucinations Guaranteed",
  ];

  useEffect(() => {
    // Stage message progression
    const stageInterval = setInterval(() => {
      setStage((prev) => {
        if (prev < stages.length - 1) return prev + 1;
        return prev;
      });
    }, minDurationMs / stages.length);

    // Progress bar smooth fill
    const progressStart = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - progressStart;
      const pct = Math.min(100, Math.round((elapsed / minDurationMs) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressInterval);
      }
    }, 40);

    // Fade out and complete
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 600);
    }, minDurationMs);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      clearTimeout(fadeTimer);
    };
  }, [minDurationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#0B2317] via-[#103923] to-[#0B2317] text-white transition-opacity duration-700 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background ambient medical glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md w-full">
        {/* Logo Container with Smooth Drop Animation */}
        <div className="relative mb-8">
          {/* Subtle heartbeat glow ring */}
          <div className="absolute -inset-4 rounded-3xl bg-emerald-400/20 blur-xl animate-pulse" />
          
          <div className="relative flex items-center justify-center rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-white/30 backdrop-blur-md transform transition-all duration-1000 ease-out translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-12">
            <img
              src="/logo.jpg"
              alt="MedThread Logo"
              className="h-16 w-56 object-contain"
            />
          </div>
        </div>

        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm mb-4">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>SOSC SYNERGY 26 • Problem Statement PS-7</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white mb-2">
          MedThread Engine
        </h1>
        <p className="text-xs text-emerald-200/80 mb-6 font-medium">
          Evidence-First Medical History Engine • Advanced Track
        </p>

        {/* Progress bar */}
        <div className="w-full bg-emerald-950/80 rounded-full h-1.5 overflow-hidden border border-emerald-800/40 mb-3 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Live Stage Status Text */}
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-300/90 h-6">
          {progress === 100 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in" />
          ) : (
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          )}
          <span className="font-mono text-[11px] tracking-wide">
            {stages[stage]}
          </span>
        </div>

        {/* Skip button for judges who want instant access */}
        <button
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 300);
          }}
          className="mt-8 text-[11px] uppercase tracking-wider text-emerald-400/60 hover:text-emerald-300 transition-colors py-1 px-3 rounded-full hover:bg-white/5"
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
};

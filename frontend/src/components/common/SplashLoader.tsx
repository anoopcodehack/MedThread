import { useEffect, useState } from "react";

interface SplashLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashLoader = ({
  onComplete,
  durationMs = 1500,
}: SplashLoaderProps) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isDropped, setIsDropped] = useState<boolean>(false);

  useEffect(() => {
    // Trigger logo drop down immediately on mount
    const dropTimer = setTimeout(() => {
      setIsDropped(true);
    }, 50);

    // Fade out after duration
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }, durationMs);

    return () => {
      clearTimeout(dropTimer);
      clearTimeout(fadeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#071D12] via-[#0E3520] to-[#071D12] transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft atmospheric ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl animate-pulse" />
      </div>

      {/* Just the logo dropping smoothly from top and settling */}
      <div
        className={`relative z-10 transition-all duration-700 ease-out transform ${
          isDropped
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-12 opacity-0 scale-95"
        }`}
      >
        <div className="relative rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-white/30 backdrop-blur-md">
          <img
            src="/logo.jpg"
            alt="MedThread"
            className="h-16 w-56 object-contain"
          />
        </div>
      </div>
    </div>
  );
};

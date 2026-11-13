import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";

interface SplashLoaderProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashLoader = ({
  onComplete,
  durationMs = 600,
}: SplashLoaderProps) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isDropped, setIsDropped] = useState<boolean>(false);

  useEffect(() => {
    // Drop logo immediately on mount with snappy timing
    const dropTimer = setTimeout(() => {
      setIsDropped(true);
    }, 20);

    // Fade out fast after brief display
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 250);
    }, durationMs);

    return () => {
      clearTimeout(dropTimer);
      clearTimeout(fadeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#071D12] via-[#0E3520] to-[#071D12] transition-opacity duration-300 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Soft atmospheric ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-emerald-500/15 blur-2xl" />
      </div>

      {/* Snappy smooth logo drop */}
      <div
        className={`relative z-10 transition-all duration-300 ease-out transform ${
          isDropped
            ? "translate-y-0 opacity-100 scale-100"
            : "-translate-y-8 opacity-0 scale-95"
        }`}
      >
        <div className="relative flex items-center justify-center p-3">
          <BrandLogo theme="light" size="lg" showSubtitle />
        </div>
      </div>
    </div>
  );
};

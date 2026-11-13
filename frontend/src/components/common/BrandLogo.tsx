import React from "react";

interface BrandLogoProps {
  className?: string;
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  theme = "dark",
  size = "md",
  showSubtitle = false,
}) => {
  const isLight = theme === "light";

  const heightClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-11",
    xl: "h-14",
  };

  const logoSrc = isLight ? "/logo-light.png" : "/logo.png";
  const fallbackSrc = "/logo.jpg";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        onError={(e) => {
          // Fallback to logo.png or logo.jpg if needed
          if (e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
          }
        }}
        alt="MedThread"
        className={`${heightClasses[size]} w-auto object-contain transition-transform`}
      />
      {showSubtitle && (
        <span
          className={`text-[10px] font-mono uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
            isLight ? "bg-white/10 text-emerald-200" : "bg-emerald-50 text-forest"
          }`}
        >
          Clinical
        </span>
      )}
    </div>
  );
};

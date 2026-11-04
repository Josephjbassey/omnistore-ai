import React from "react";

interface OmniStoreLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const OmniStoreLogo: React.FC<OmniStoreLogoProps> = ({
  className = "",
  size = 28,
  showText = true,
  textClassName = "",
}) => {
  return (
    <div className={`flex items-center space-x-2.5 group cursor-pointer select-none ${className}`}>
      {/* Precision Geometric Vector Mark */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#161a23] to-[#0c0f16] border border-white/15 p-1.5 shadow-[0_2px_12px_rgba(16,185,129,0.18)] group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all duration-300"
        style={{ width: size + 8, height: size + 8 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="omni-vec-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="vec-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Market Canopy Canopy Roof */}
          <path
            d="M5 11L16 5.5L27 11V13L16 8L5 13V11Z"
            fill="url(#omni-vec-grad)"
            className="transition-opacity group-hover:opacity-100 opacity-90"
          />

          {/* Hexagonal Spatial Bounding Box */}
          <path
            d="M16 10.5L25 15.5V23L16 28L7 23V15.5L16 10.5Z"
            stroke="url(#omni-vec-grad)"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />

          {/* Camera Aperture / Spatial Focus Core */}
          <circle cx="16" cy="19" r="3.2" fill="#10b981" filter="url(#vec-glow)" />
          <circle cx="16" cy="19" r="1.4" fill="#ffffff" />

          {/* Precision Alignment Tick Marks */}
          <path
            d="M8.5 19H10.5M21.5 19H23.5M16 14V15.5M16 22.5V24"
            stroke="#34d399"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-bold tracking-tight text-white uppercase text-xs sm:text-sm font-sans ${textClassName}`}
            >
              OmniStore<span className="text-emerald-400 font-extrabold tracking-normal">.AI</span>
            </span>
          </div>
          <span className="text-[9px] font-mono text-zinc-400 tracking-wider hidden sm:block">
            Autonomous Stall Digitizer
          </span>
        </div>
      )}
    </div>
  );
};

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="infrale-hex-border" x1="10" y1="4" x2="70" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1A52C4" />
          <stop offset="55%"  stopColor="#2B7FE0" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="infrale-inner-grad" x1="20" y1="20" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3B8AE8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="infrale-face-grad" x1="28" y1="30" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5BA8F0" />
          <stop offset="100%" stopColor="#1A6FD4" />
        </linearGradient>
      </defs>

      {/* ── Hexagon background ── */}
      <path
        d="M40 4 L72 22 L72 58 L40 76 L8 58 L8 22 Z"
        fill="#080F1C"
      />

      {/* ── Outer hex border (gradient) ── */}
      <path
        d="M40 4 L72 22 L72 58 L40 76 L8 58 L8 22 Z"
        stroke="url(#infrale-hex-border)"
        strokeWidth="3.5"
        fill="none"
        strokeLinejoin="round"
      />

      {/* ── Inner hex border (subtle) ── */}
      <path
        d="M40 13 L64 27 L64 53 L40 67 L16 53 L16 27 Z"
        stroke="url(#infrale-hex-border)"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
        strokeLinejoin="round"
      />

      {/* ── Left column / pillar ── */}
      <rect x="20" y="30" width="7" height="26" rx="1.5" fill="url(#infrale-inner-grad)" />

      {/* ── 3D cube — right face (dark) ── */}
      <path
        d="M32 48 L32 37 L44 31 L44 42 Z"
        fill="url(#infrale-face-grad)"
        opacity="0.55"
      />

      {/* ── 3D cube — front face ── */}
      <path
        d="M32 48 L44 42 L44 56 L32 56 Z"
        fill="url(#infrale-inner-grad)"
        opacity="0.9"
      />

      {/* ── 3D cube — top face ── */}
      <path
        d="M32 37 L44 31 L56 37 L44 43 Z"
        fill="url(#infrale-inner-grad)"
      />

      {/* ── 3D cube — right face (light) ── */}
      <path
        d="M44 43 L56 37 L56 51 L44 57 Z"
        fill="url(#infrale-face-grad)"
        opacity="0.7"
      />

      {/* ── 3D cube — front-right face connector ── */}
      <path
        d="M44 42 L56 36 L56 50 L44 56 Z"
        fill="#1257B4"
        opacity="0.4"
      />
    </svg>
  );
}

interface LogoFullProps {
  size?: number;
  className?: string;
}

export function LogoFull({ size = 28, className }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      <div className="min-w-0">
        <span className="text-sm font-bold block leading-tight tracking-wide" style={{ color: "#ffffff" }}>
          Infrale{" "}
          <span style={{ color: "#06B6D4", fontFamily: "JetBrains Mono, monospace", fontSize: 13 }}>
            3D
          </span>
        </span>
        <span className="text-[10px] font-mono tracking-widest block" style={{ color: "#5E768F" }}>
          INFRAESTRUCTURA
        </span>
      </div>
    </div>
  );
}

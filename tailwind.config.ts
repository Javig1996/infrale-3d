import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Paleta Infrale 3D — Cockpit Design System (handoff Propuesta B)
        brand: {
          950: "#070D16",   // deepest dark / viewer background
          900: "#0B1320",   // cockpit bg
          850: "#0E1A2A",   // input bg / surface 2
          800: "#111E2E",   // card bg / panel solid
          750: "#14263C",   // gradient A
          700: "#1A2A3C",   // subtle border / line 2
          600: "#25394F",   // strong border / line
          500: "#0A3C80",   // brand dark
          400: "#1257B4",   // brand medium
          300: "#0E4DA4",   // brand primary — royal navy
          200: "#6FA0DD",   // brand light
          100: "#DCE8F8",   // brand very light
          50:  "#EEF4FC",   // brand tint
        },
        cyan: {
          glow: "#06B6D4",  // accent primary — cyan tech (CTAs, selection, live)
          400:  "#22D3EE",  // accent 2 — brighter cyan
          300:  "#E2F7FB",  // accent tint
        },
        surface: {
          DEFAULT: "#111E2E",   // elevated card bg
          hover:   "#0E1A2A",   // hover state
          active:  "#14263C",   // active / selected state
          border:  "#25394F",   // all borders
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(37,57,79,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,57,79,0.3) 1px, transparent 1px)",
        "glow-radial":
          "radial-gradient(ellipse at top, rgba(14,77,164,0.12) 0%, transparent 70%)",
        "cockpit-bg":
          "radial-gradient(ellipse 140% 80% at 50% 0%, rgba(6,182,212,0.04) 0%, transparent 60%)",
      },
      boxShadow: {
        "glow-sm":    "0 0 10px rgba(6,182,212,0.18)",
        "glow-md":    "0 0 20px rgba(6,182,212,0.26)",
        "glow-lg":    "0 0 40px rgba(6,182,212,0.32)",
        "inner-glow": "inset 0 1px 0 rgba(6,182,212,0.12)",
        "glass":      "0 18px 50px rgba(0,0,0,0.4)",
        "glass-sm":   "0 8px 24px rgba(0,0,0,0.32)",
      },
      fontFamily: {
        sans: ["Inter", "Helvetica Neue", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse":   "glow-pulse 2s ease-in-out infinite alternate",
        "slide-in":     "slide-in 0.3s ease-out",
        "fade-in":      "fade-in 0.35s ease-out",
        "slide-up":     "slide-up 0.25s ease-out",
        "scale-in":     "scale-in 0.2s ease-out",
        "shimmer":      "shimmer 2s linear infinite",
        "toast-in":     "toast-in 0.3s ease-out",
        "toast-out":    "toast-out 0.2s ease-in forwards",
        "sidebar-in":   "sidebar-in 0.25s ease-out",
        "panel-in":     "panel-in 0.2s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          from: { boxShadow: "0 0 5px rgba(6,182,212,0.1)" },
          to:   { boxShadow: "0 0 20px rgba(6,182,212,0.35)" },
        },
        "slide-in": {
          from: { transform: "translateX(-10px)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.97)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-out": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to:   { opacity: "0", transform: "translateY(4px) scale(0.97)" },
        },
        "sidebar-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "panel-in": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

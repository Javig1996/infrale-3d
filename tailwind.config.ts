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
        // Paleta Infrale 3D — Azul Tech Futurista
        brand: {
          950: "#020917",
          900: "#050d1a",
          850: "#071224",
          800: "#0a1628",
          750: "#0d1e35",
          700: "#112540",
          600: "#163366",
          500: "#1a4080",
          400: "#1d5099",
          300: "#2563eb",
          200: "#3b82f6",
          100: "#60a5fa",
          50:  "#bfdbfe",
        },
        cyan: {
          glow: "#00d4ff",
          400:  "#22d3ee",
          300:  "#67e8f9",
        },
        surface: {
          DEFAULT: "#0a1628",
          hover:   "#0f2044",
          active:  "#152a55",
          border:  "#1a3a6b",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(26,58,107,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(26,58,107,0.3) 1px, transparent 1px)",
        "glow-radial":
          "radial-gradient(ellipse at top, rgba(37,99,235,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(0,212,255,0.15)",
        "glow-md": "0 0 20px rgba(0,212,255,0.2)",
        "glow-lg": "0 0 40px rgba(0,212,255,0.25)",
        "inner-glow": "inset 0 1px 0 rgba(0,212,255,0.1)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "glow-pulse": {
          from: { boxShadow: "0 0 5px rgba(0,212,255,0.1)" },
          to:   { boxShadow: "0 0 20px rgba(0,212,255,0.3)" },
        },
        "slide-in": {
          from: { transform: "translateX(-10px)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

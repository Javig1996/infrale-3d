"use client";

import { useTheme }    from "@/components/ui/theme-provider";
import { Moon, Sun, Monitor, Check } from "lucide-react";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="page-title mb-1">Configuración</h1>
      <p className="page-subtitle mb-8">Personaliza tu experiencia en Infrale 3D</p>

      {/* Tarjeta Apariencia */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center">
            <Monitor className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Apariencia</h2>
            <p className="text-xs text-slate-500">Elige el tema visual de la aplicación</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Oscuro */}
          <button
            onClick={() => setTheme("dark")}
            className="relative rounded-xl border p-4 text-left transition-all duration-150"
            style={{
              background:   theme === "dark" ? "rgba(14,77,164,0.12)" : "rgba(17,30,46,0.5)",
              borderColor:  theme === "dark" ? "#0E4DA4"              : "rgba(37,57,79,0.6)",
              boxShadow:    theme === "dark" ? "0 0 0 1px #0E4DA420"  : "none",
            }}
          >
            {theme === "dark" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-300 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
            {/* Preview oscuro */}
            <div className="w-full h-20 rounded-lg mb-3 overflow-hidden border border-slate-700/50"
              style={{ background: "#0B1320" }}>
              <div style={{ height: 6, background: "#111E2E", borderBottom: "1px solid #25394F" }} />
              <div className="flex h-full">
                <div style={{ width: 32, background: "#0E1A2A", borderRight: "1px solid #25394F" }} />
                <div className="flex-1 p-1.5 space-y-1">
                  <div style={{ height: 5, width: "60%", background: "#1A2A3C", borderRadius: 2 }} />
                  <div style={{ height: 5, width: "40%", background: "#1A2A3C", borderRadius: 2 }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">Oscuro</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Ideal para entornos con poca luz</p>
          </button>

          {/* Claro */}
          <button
            onClick={() => setTheme("light")}
            className="relative rounded-xl border p-4 text-left transition-all duration-150"
            style={{
              background:   theme === "light" ? "rgba(14,77,164,0.08)" : "rgba(17,30,46,0.5)",
              borderColor:  theme === "light" ? "#0E4DA4"              : "rgba(37,57,79,0.6)",
              boxShadow:    theme === "light" ? "0 0 0 1px #0E4DA420"  : "none",
            }}
          >
            {theme === "light" && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-300 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
            {/* Preview claro */}
            <div className="w-full h-20 rounded-lg mb-3 overflow-hidden border border-slate-200"
              style={{ background: "#f0f4f8" }}>
              <div style={{ height: 6, background: "#ffffff", borderBottom: "1px solid #e2e8f0" }} />
              <div className="flex h-full">
                <div style={{ width: 32, background: "#ffffff", borderRight: "1px solid #e2e8f0" }} />
                <div className="flex-1 p-1.5 space-y-1">
                  <div style={{ height: 5, width: "60%", background: "#e2e8f0", borderRadius: 2 }} />
                  <div style={{ height: 5, width: "40%", background: "#e2e8f0", borderRadius: 2 }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-medium text-slate-200">Claro</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Ideal para entornos con mucha luz</p>
          </button>
        </div>
      </div>
    </div>
  );
}

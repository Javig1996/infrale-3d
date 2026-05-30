"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { MODULE_LIST, MODULE_KEY, type ModuleId } from "@/lib/modules";

export default function ModulosPage() {
  const router              = useRouter();
  const [ready, setReady]   = useState(false);
  const [hovered, setHovered] = useState<ModuleId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MODULE_KEY);
    if (saved) {
      router.replace("/dashboard");
    } else {
      setReady(true);
    }
  }, [router]);

  function selectModule(id: ModuleId) {
    localStorage.setItem(MODULE_KEY, id);
    router.push("/dashboard");
  }

  if (!ready) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#070D16" }}>

      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", top: "-15%", left: "10%",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(14,77,164,0.10) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", right: "5%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(50px)",
        }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Isotipo */}
          <div className="flex justify-center mb-5">
            <div style={{
              width: 44, height: 44,
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr", gap: 4,
            }}>
              <span style={{ background: "#2E6FD6", borderRadius: 4 }} />
              <span style={{ background: "#6FA0DD", borderRadius: 4 }} />
              <span style={{ background: "#06B6D4", borderRadius: 4 }} />
              <span style={{ background: "#1257B4", borderRadius: 4 }} />
            </div>
          </div>
          <p className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-2">Infrale 3D</p>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Selecciona tu módulo de trabajo</h1>
          <p className="text-sm text-slate-500">La interfaz se adaptará a las herramientas de tu área</p>
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULE_LIST.map((mod) => {
            const isHovered = hovered === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => selectModule(mod.id as ModuleId)}
                onMouseEnter={() => setHovered(mod.id as ModuleId)}
                onMouseLeave={() => setHovered(null)}
                className="text-left rounded-2xl border transition-all duration-200 p-5 group"
                style={{
                  background:   isHovered ? "rgba(20,38,60,0.95)" : "rgba(13,24,38,0.80)",
                  borderColor:  isHovered ? mod.color            : "rgba(37,57,79,0.6)",
                  boxShadow:    isHovered ? `0 0 0 1px ${mod.color}40, 0 20px 40px rgba(0,0,0,0.4)` : "none",
                  transform:    isHovered ? "translateY(-2px)"  : "none",
                }}
              >
                {/* Cabecera: badge + nombre */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: mod.color, color: mod.textColor }}>
                    {mod.code}
                  </div>
                  <div>
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Módulo</p>
                    <p className="text-base font-semibold text-slate-100 leading-tight">{mod.name}</p>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{mod.description}</p>

                {/* Lista de funcionalidades */}
                <ul className="space-y-1.5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: mod.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-5 flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: isHovered ? mod.color : "#5E768F" }}>
                  Seleccionar módulo
                  <span className="transition-transform duration-150" style={{ transform: isHovered ? "translateX(3px)" : "none" }}>→</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Puedes cambiar de módulo en cualquier momento desde el menú lateral
        </p>
      </div>
    </div>
  );
}

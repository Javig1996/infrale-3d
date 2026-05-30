"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { CheckCircle2 }        from "lucide-react";
import { LogoMark }            from "@/components/ui/logo";
import { MODULE_LIST, MODULE_KEY, type ModuleId } from "@/lib/modules";

export default function ModulosPage() {
  const router                = useRouter();
  const [ready, setReady]     = useState(false);
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
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-y-auto"
      style={{ background: "#070D16" }}
    >
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: "absolute", top: "-20%", left: "5%",
          width: 700, height: 700,
          background: "radial-gradient(circle, rgba(14,77,164,0.09) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(70px)",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", right: "5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)",
        }} />
        {/* Grid sutil */}
        <div className="absolute inset-0" style={{
          backgroundSize: "44px 44px",
          backgroundImage: `
            linear-gradient(rgba(37,57,79,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(37,57,79,0.08) 1px, transparent 1px)
          `,
        }} />
      </div>

      <div className="relative z-10 w-full max-w-3xl py-8">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <LogoMark size={52} />
          </div>
          <p className="text-xs font-mono tracking-widest text-slate-600 uppercase mb-3">
            Infrale 3D
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2 tracking-tight">
            Selecciona tu módulo de trabajo
          </h1>
          <p className="text-sm text-slate-500">
            La interfaz se adaptará a las herramientas de tu área
          </p>
        </div>

        {/* Grid 2×2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULE_LIST.map((mod) => {
            const isHov = hovered === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => selectModule(mod.id as ModuleId)}
                onMouseEnter={() => setHovered(mod.id as ModuleId)}
                onMouseLeave={() => setHovered(null)}
                className="text-left rounded-2xl border transition-all duration-200 p-5 group"
                style={{
                  background:  isHov ? "rgba(20,38,60,0.95)" : "rgba(13,24,38,0.82)",
                  borderColor: isHov ? mod.color            : "rgba(37,57,79,0.6)",
                  boxShadow:   isHov
                    ? `0 0 0 1px ${mod.color}45, 0 20px 50px rgba(0,0,0,0.45)`
                    : "0 1px 3px rgba(0,0,0,0.3)",
                  transform:   isHov ? "translateY(-3px)" : "none",
                }}
              >
                {/* Cabecera */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-lg"
                    style={{ background: mod.color, color: mod.textColor }}
                  >
                    {mod.code}
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none mb-0.5">
                      Módulo
                    </p>
                    <p className="text-base font-semibold text-slate-100 leading-tight">
                      {mod.name}
                    </p>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{mod.description}</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: mod.color }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-xs font-medium transition-all duration-150"
                  style={{ color: isHov ? mod.color : "#4A6080" }}
                >
                  Seleccionar módulo
                  <span
                    className="transition-transform duration-150"
                    style={{ transform: isHov ? "translateX(4px)" : "none" }}
                  >
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-700 mt-8">
          Puedes cambiar de módulo en cualquier momento desde el menú lateral
        </p>
      </div>
    </div>
  );
}

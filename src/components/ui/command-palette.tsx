"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter }   from "next/navigation";
import { Command }     from "cmdk";
import {
  Search, LayoutDashboard, FolderKanban, Plus,
  Box, Wrench, Settings, TrendingUp, X, ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn }           from "@/lib/utils";

type ProjectItem = { id: string; name: string; type: string };

const STATIC_ACTIONS = [
  { id: "dashboard",     label: "Ir al Dashboard",      icon: LayoutDashboard, href: "/dashboard",        group: "Navegación" },
  { id: "proyectos",     label: "Ir a Proyectos",        icon: FolderKanban,    href: "/proyectos",        group: "Navegación" },
  { id: "nuevo-proyecto",label: "Nuevo Proyecto",        icon: Plus,            href: "/proyectos/nuevo",  group: "Acciones" },
];

interface CommandPaletteProps {
  open:    boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router            = useRouter();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading]   = useState(false);

  // Carga proyectos al abrir
  useEffect(() => {
    if (!open) { setQuery(""); return; }
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("projects")
      .select("id, name, type")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setProjects((data ?? []) as ProjectItem[]);
        setLoading(false);
      });
  }, [open]);

  const navigate = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  // Filtrar proyectos según query
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const TYPE_ICONS: Record<string, React.ElementType> = {
    electrico: Box,
    civil:     TrendingUp,
    mecanico:  Wrench,
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed left-1/2 top-[15vh] z-[70] -translate-x-1/2 w-full max-w-lg px-4">
        <Command
          className="glass-card overflow-hidden shadow-2xl"
          shouldFilter={false}
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Buscar proyectos o acciones..."
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="btn-icon w-6 h-6 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="cmd-kbd cursor-pointer hover:bg-surface-active transition-colors"
              aria-label="Cerrar"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-[360px] overflow-y-auto py-2">
            <Command.Empty className="py-10 text-center text-sm text-slate-500">
              {loading ? (
                <span className="animate-pulse">Buscando...</span>
              ) : (
                "Sin resultados para tu búsqueda."
              )}
            </Command.Empty>

            {/* Acciones rápidas */}
            <Command.Group
              heading={
                <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 block">
                  Acciones
                </span>
              }
            >
              {STATIC_ACTIONS.filter(a =>
                !query || a.label.toLowerCase().includes(query.toLowerCase())
              ).map(action => {
                const Icon = action.icon;
                return (
                  <Command.Item
                    key={action.id}
                    value={action.label}
                    onSelect={() => navigate(action.href)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer",
                      "text-sm text-slate-300 transition-colors duration-100",
                      "aria-selected:bg-surface-hover aria-selected:text-slate-100",
                      "outline-none"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-brand-200" />
                    </div>
                    <span className="flex-1">{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  </Command.Item>
                );
              })}
            </Command.Group>

            {/* Proyectos */}
            {filteredProjects.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 block">
                    Proyectos
                  </span>
                }
              >
                {filteredProjects.map(project => {
                  const Icon = TYPE_ICONS[project.type] ?? FolderKanban;
                  const TYPE_COLOR: Record<string, string> = {
                    electrico: "text-yellow-400",
                    civil:     "text-green-400",
                    mecanico:  "text-orange-400",
                  };
                  return (
                    <Command.Item
                      key={project.id}
                      value={project.name}
                      onSelect={() => navigate(`/proyectos/${project.id}`)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer",
                        "text-sm text-slate-300 transition-colors duration-100",
                        "aria-selected:bg-surface-hover aria-selected:text-slate-100",
                        "outline-none"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center shrink-0">
                        <Icon className={cn("w-3.5 h-3.5", TYPE_COLOR[project.type] ?? "text-slate-400")} />
                      </div>
                      <span className="flex-1 truncate">{project.name}</span>
                      <span className="text-xs text-slate-600 capitalize shrink-0">{project.type}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {/* Módulos de navegación */}
            <Command.Group
              heading={
                <span className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 block">
                  Módulos
                </span>
              }
            >
              {[
                { label: "Planificación",     icon: Box,          desc: "Control de elementos" },
                { label: "Operación",         icon: Settings,     desc: "Fichas técnicas" },
                { label: "Mantenimiento",     icon: Wrench,       desc: "Registros y alertas" },
              ].filter(m =>
                !query || m.label.toLowerCase().includes(query.toLowerCase())
              ).map(mod => {
                const Icon = mod.icon;
                return (
                  <Command.Item
                    key={mod.label}
                    value={mod.label}
                    onSelect={() => navigate("/proyectos")}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer",
                      "text-sm text-slate-300 transition-colors duration-100",
                      "aria-selected:bg-surface-hover aria-selected:text-slate-100",
                      "outline-none"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-surface-hover border border-surface-border flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{mod.label}</p>
                      <p className="text-xs text-slate-500">{mod.desc}</p>
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="border-t border-surface-border px-4 py-2 flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <kbd className="cmd-kbd">↑↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="cmd-kbd">↵</kbd> abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="cmd-kbd">ESC</kbd> cerrar
            </span>
          </div>
        </Command>
      </div>
    </>
  );
}

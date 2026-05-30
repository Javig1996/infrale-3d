"use client";

import Link                           from "next/link";
import { usePathname, useRouter }     from "next/navigation";
import { useEffect, useState }        from "react";
import {
  LayoutDashboard, FolderKanban, CalendarRange, Clock4, Users,
  DollarSign, FileText, Flag, Activity, Bell, TrendingUp,
  Calendar, Wrench, History, Database, X, ChevronRight,
} from "lucide-react";
import { getModule, MODULE_KEY, type ModuleId } from "@/lib/modules";

/* ── Icon map ─────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, FolderKanban, CalendarRange, Clock4, Users,
  DollarSign, FileText, Flag, Activity, Bell, TrendingUp,
  Calendar, Wrench, History, Database,
};

/* ── NavItem ──────────────────────────────────────────────── */
function NavItem({ href, label, iconName, onClick }: {
  href: string; label: string; iconName: string; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active   = pathname === href ||
    (href !== "/dashboard" && href !== "/proyectos" && pathname.startsWith(href));
  const Icon     = ICON_MAP[iconName] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={active ? "nav-item-active" : "nav-item"}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

/* ── Sidebar (shell) ──────────────────────────────────────── */
interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-[var(--sidebar-width,15rem)] shrink-0 h-screen sticky top-0 flex-col border-r border-surface-border bg-brand-950/80 backdrop-blur-xl">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width,15rem)] flex flex-col
          border-r border-surface-border bg-brand-950 backdrop-blur-xl
          transition-transform duration-250 ease-out
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
        aria-label="Menú de navegación"
      >
        <SidebarContent onClose={onClose} showCloseButton />
      </aside>
    </>
  );
}

/* ── SidebarContent ───────────────────────────────────────── */
function SidebarContent({
  onClose,
  showCloseButton = false,
}: {
  onClose: () => void;
  showCloseButton?: boolean;
}) {
  const router              = useRouter();
  const [moduleId, setModuleId] = useState<ModuleId | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(MODULE_KEY) as ModuleId | null;
    setModuleId(saved);
  }, []);

  const mod = getModule(moduleId);

  function changeModule() {
    localStorage.removeItem(MODULE_KEY);
    onClose();
    router.push("/modulos");
  }

  return (
    <>
      {/* Logo + close */}
      <div className="px-4 py-4 border-b border-surface-border flex items-center justify-between gap-3">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group min-w-0">
          <div style={{
            width: 28, height: 28,
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr", gap: 3, flexShrink: 0,
          }}>
            <span style={{ background: "#2E6FD6", borderRadius: 3 }} />
            <span style={{ background: "#6FA0DD", borderRadius: 3 }} />
            <span style={{ background: "#06B6D4", borderRadius: 3 }} />
            <span style={{ background: "#1257B4", borderRadius: 3 }} />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold block leading-tight" style={{ color: "#fff" }}>
              INFRALE <span style={{ color: "#06B6D4", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>3D</span>
            </span>
            <span className="text-[10px] font-mono tracking-wider" style={{ color: "#5E768F" }}>INFRAESTRUCTURA</span>
          </div>
        </Link>

        {showCloseButton && (
          <button onClick={onClose} className="btn-icon shrink-0" aria-label="Cerrar menú">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Badge módulo activo */}
      {mod && (
        <div className="px-3 pt-3 pb-2 border-b border-surface-border">
          <div
            className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
            style={{
              background:   `${mod.color}18`,
              border:       `1px solid ${mod.color}35`,
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: mod.color, color: mod.textColor }}
            >
              {mod.code}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                Módulo
              </p>
              <p className="text-xs font-semibold text-slate-200 truncate">{mod.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
        {mod ? (
          <div className="space-y-0.5">
            {mod.nav.map(item => (
              <NavItem key={item.href} {...item} onClick={onClose} />
            ))}
          </div>
        ) : (
          /* Fallback mientras hidrata */
          <div className="space-y-0.5">
            <NavItem href="/dashboard" label="Dashboard" iconName="LayoutDashboard" onClick={onClose} />
            <NavItem href="/proyectos" label="Proyectos"  iconName="FolderKanban"   onClick={onClose} />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-border space-y-2">
        <button
          onClick={changeModule}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-colors"
        >
          <div style={{
            width: 14, height: 14,
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr", gap: 2, flexShrink: 0,
          }}>
            <span style={{ background: "#2E6FD6", borderRadius: 1 }} />
            <span style={{ background: "#6FA0DD", borderRadius: 1 }} />
            <span style={{ background: "#06B6D4", borderRadius: 1 }} />
            <span style={{ background: "#1257B4", borderRadius: 1 }} />
          </div>
          Cambiar módulo
          <ChevronRight className="w-3 h-3 ml-auto" />
        </button>

        <div className="flex items-center gap-2">
          <span className="status-dot bg-cyan-400 animate-pulse-slow" />
          <span className="text-[11px] text-slate-600 font-mono">v1.0.0 · Fase 1</span>
        </div>
      </div>
    </>
  );
}

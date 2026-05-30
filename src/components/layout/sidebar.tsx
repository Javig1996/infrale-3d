"use client";

import Link              from "next/link";
import { usePathname }   from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Box, Wrench,
  TrendingUp, Settings, X,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/proyectos", label: "Proyectos",  icon: FolderKanban },
];

const NAV_MODULES = [
  { href: "/proyectos", label: "Planificación",     icon: Box,         suffix: "#planificacion" },
  { href: "/proyectos", label: "Control de Avance", icon: TrendingUp,  suffix: "#avance" },
  { href: "/proyectos", label: "Operación",         icon: Settings,    suffix: "#operacion" },
  { href: "/proyectos", label: "Mantenimiento",     icon: Wrench,      suffix: "#mantenimiento" },
];

interface NavItemProps {
  href:   string;
  label:  string;
  icon:   React.ElementType;
  suffix?: string;
  onClick?: () => void;
}

function NavItem({ href, label, icon: Icon, onClick }: NavItemProps) {
  const pathname = usePathname();
  const active   = pathname === href || (href !== "/dashboard" && href !== "/proyectos" && pathname.startsWith(href));

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

interface SidebarProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[var(--sidebar-width,15rem)] shrink-0 h-screen sticky top-0 flex-col border-r border-surface-border bg-brand-950/80 backdrop-blur-xl">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile sidebar — desliza desde la izquierda */}
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

function SidebarContent({ onClose, showCloseButton = false }: { onClose: () => void; showCloseButton?: boolean }) {
  return (
    <>
      {/* Logo + close button */}
      <div className="px-4 py-4 border-b border-surface-border flex items-center justify-between gap-3">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3 group min-w-0">
          {/* Isotipo 2×2 */}
          <div style={{ width: 28, height: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3, flexShrink: 0 }}>
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
          <button
            onClick={onClose}
            className="btn-icon shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Navegación principal">
        <div>
          <p className="section-title">General</p>
          <div className="space-y-0.5">
            {NAV_MAIN.map(item => (
              <NavItem key={item.href + item.label} {...item} onClick={onClose} />
            ))}
          </div>
        </div>

        <div>
          <p className="section-title">Módulos</p>
          <div className="space-y-0.5">
            {NAV_MODULES.map(item => (
              <NavItem key={item.href + item.label} {...item} onClick={onClose} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-border">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-cyan-400 animate-pulse-slow" />
          <span className="text-[11px] text-slate-600 font-mono">v1.0.0 · Fase 1</span>
        </div>
      </div>
    </>
  );
}

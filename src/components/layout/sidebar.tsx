"use client";

import Link      from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Box, Wrench,
  TrendingUp, Settings, Zap, ChevronRight,
} from "lucide-react";

const NAV_MAIN = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/proyectos",  label: "Proyectos",   icon: FolderKanban },
];

const NAV_MODULES = [
  { href: "/planificacion",   label: "Planificación",       icon: Box },
  { href: "/control-avance",  label: "Control de Avance",   icon: TrendingUp },
  { href: "/operacion",       label: "Operación",           icon: Settings },
  { href: "/mantenimiento",   label: "Mantenimiento",       icon: Wrench },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active   = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link href={href} className={active ? "nav-item-active" : "nav-item"}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 opacity-60" />}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-surface-border bg-brand-950/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-300 to-cyan-400 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold glow-text block leading-tight">Infrale 3D</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">INFRAESTRUCTURA</span>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div>
          <p className="section-title">General</p>
          <div className="space-y-0.5">
            {NAV_MAIN.map(item => <NavItem key={item.href} {...item} />)}
          </div>
        </div>

        <div>
          <p className="section-title">Módulos</p>
          <div className="space-y-0.5">
            {NAV_MODULES.map(item => <NavItem key={item.href} {...item} />)}
          </div>
        </div>
      </nav>

      {/* Indicador de versión */}
      <div className="px-4 py-3 border-t border-surface-border">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-cyan-400 animate-pulse-slow" />
          <span className="text-[11px] text-slate-500 font-mono">v1.0.0 · Fase 1</span>
        </div>
      </div>
    </aside>
  );
}

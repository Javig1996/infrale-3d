"use client";

import Image             from "next/image";
import Link              from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, LogOut, User, ChevronDown,
  Menu, Search, ChevronRight,
} from "lucide-react";
import { createClient }   from "@/lib/supabase/client";
import type { Profile }   from "@/types/database";
import { useState, useMemo } from "react";
import { useCommand }     from "@/components/ui/command-provider";

interface HeaderProps {
  profile:     Profile | null;
  onMenuClick: () => void;
}

// Genera breadcrumbs desde el pathname
function useBreadcrumbs() {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return [];

    const crumbs: { label: string; href: string }[] = [];
    const LABELS: Record<string, string> = {
      dashboard:      "Dashboard",
      proyectos:      "Proyectos",
      nuevo:          "Nuevo",
      planificacion:  "Planificación",
      operacion:      "Operación",
      mantenimiento:  "Mantenimiento",
      visor:          "Visor 3D",
    };

    let accumulated = "";
    for (const seg of segments) {
      accumulated += `/${seg}`;
      const label = LABELS[seg] ?? (seg.length > 12 ? `${seg.slice(0, 8)}…` : seg);
      crumbs.push({ label, href: accumulated });
    }
    return crumbs;
  }, [pathname]);
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const router              = useRouter();
  const [open, setOpen]     = useState(false);
  const breadcrumbs         = useBreadcrumbs();
  const { toggle: openCmd } = useCommand();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="h-14 border-b border-surface-border bg-brand-950/60 backdrop-blur-xl px-3 sm:px-4 flex items-center gap-2 sticky top-0 z-30">

      {/* Hamburger — solo mobile */}
      <button
        onClick={onMenuClick}
        className="btn-icon lg:hidden shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="flex-1 flex items-center gap-1 min-w-0 overflow-hidden">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-xs min-w-0">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  {isLast ? (
                    <span className="font-medium text-slate-200 truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-slate-500 hover:text-slate-300 transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        ) : (
          <span className="text-sm font-semibold text-slate-100">Dashboard</span>
        )}
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Búsqueda / Comando */}
        <button
          onClick={openCmd}
          className="hidden sm:flex btn-ghost items-center gap-2 px-2.5 py-1.5 text-slate-500 hover:text-slate-300 text-xs"
          aria-label="Abrir buscador de comandos"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Buscar</span>
          <span className="cmd-kbd hidden md:inline-flex">⌘K</span>
        </button>

        {/* Notificaciones */}
        <button className="btn-icon relative" aria-label="Notificaciones">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" aria-hidden="true" />
        </button>

        {/* Menú de usuario */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-expanded={open}
            aria-haspopup="true"
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? ""}
                width={28} height={28}
                className="w-7 h-7 rounded-full object-cover border border-surface-border"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[120px]">
                {profile?.full_name ?? "Usuario"}
              </p>
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-2 w-56 glass-card py-1 z-20 animate-scale-in">
                <div className="px-3 py-2.5 border-b border-surface-border mb-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{profile?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                </div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-hover transition-colors">
                  <User className="w-3.5 h-3.5" />
                  Mi perfil
                </button>
                <div className="my-1 divider" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

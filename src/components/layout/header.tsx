"use client";

import Image            from "next/image";
import { useRouter }    from "next/navigation";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { useState }     from "react";

interface HeaderProps {
  profile: Profile | null;
  title?:  string;
}

export function Header({ profile, title }: HeaderProps) {
  const router          = useRouter();
  const [open, setOpen] = useState(false);

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
    <header className="h-14 border-b border-surface-border bg-brand-950/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Título de página */}
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold text-slate-100">{title}</h1>
        )}
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-2">
        <button className="btn-ghost relative p-2">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </button>

        {/* Menú de usuario */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
          >
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? ""} width={28} height={28} className="w-7 h-7 rounded-full object-cover border border-surface-border" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white">
                {initials}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">{profile?.full_name ?? "Usuario"}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{profile?.email}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 glass-card py-1 z-20">
                <div className="px-3 py-2 border-b border-surface-border mb-1">
                  <p className="text-xs font-medium text-slate-200">{profile?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{profile?.email}</p>
                </div>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-hover transition-colors">
                  <User className="w-4 h-4" />
                  Mi perfil
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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

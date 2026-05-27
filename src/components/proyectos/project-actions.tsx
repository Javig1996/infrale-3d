"use client";

import { useState }       from "react";
import { useRouter }      from "next/navigation";
import { UserPlus, Trash2, MoreVertical, Pencil, Loader2 } from "lucide-react";
import { createClient }   from "@/lib/supabase/client";
import { InviteMember }   from "./invite-member";

interface Props {
  projectId: string;
  isOwner?: boolean;
}

export function ProjectActions({ projectId, isOwner = false }: Props) {
  const router                  = useRouter();
  const [menu, setMenu]         = useState(false);
  const [invite, setInvite]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm]   = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setConfirm(false);
    setMenu(false);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", projectId);
    router.push("/proyectos");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isOwner && (
          <button onClick={() => setInvite(!invite)} className="btn-secondary text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            Invitar
          </button>
        )}

        <div className="relative">
          <button onClick={() => setMenu(!menu)} className="btn-ghost p-2" title="Más opciones">
            <MoreVertical className="w-4 h-4" />
          </button>

          {menu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 glass-card py-1 z-20 shadow-xl">
                {isOwner && (
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-hover transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar proyecto
                  </button>
                )}
                <button
                  onClick={() => { setMenu(false); setConfirm(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar proyecto
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Eliminar proyecto</h3>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Se eliminarán permanentemente todos los modelos IFC, miembros y datos asociados a este proyecto.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirm(false)}
                className="btn-secondary flex-1 justify-center text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <InviteMember projectId={projectId} onClose={() => setInvite(false)} />
          </div>
        </div>
      )}
    </>
  );
}

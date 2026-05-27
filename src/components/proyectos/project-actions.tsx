"use client";

import { useState }       from "react";
import { useRouter }      from "next/navigation";
import { UserPlus, Trash2, MoreVertical, Pencil } from "lucide-react";
import { createClient }   from "@/lib/supabase/client";
import { InviteMember }   from "./invite-member";

interface Props { projectId: string }

export function ProjectActions({ projectId }: Props) {
  const router                = useRouter();
  const [menu, setMenu]       = useState(false);
  const [invite, setInvite]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", projectId);
    router.push("/proyectos");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setInvite(!invite)} className="btn-secondary text-xs">
        <UserPlus className="w-3.5 h-3.5" />
        Invitar
      </button>

      <div className="relative">
        <button onClick={() => setMenu(!menu)} className="btn-ghost p-2">
          <MoreVertical className="w-4 h-4" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 glass-card py-1 z-20">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-100 hover:bg-surface-hover transition-colors">
                <Pencil className="w-3.5 h-3.5" />
                Editar proyecto
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Eliminando..." : "Eliminar proyecto"}
              </button>
            </div>
          </>
        )}
      </div>

      {invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <InviteMember projectId={projectId} onClose={() => setInvite(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

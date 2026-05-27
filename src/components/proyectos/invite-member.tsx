"use client";

import { useState }      from "react";
import { useForm }       from "react-hook-form";
import { zodResolver }   from "@hookform/resolvers/zod";
import { z }             from "zod";
import { Loader2, UserPlus, X } from "lucide-react";
import { createClient }  from "@/lib/supabase/client";
import { useRouter }     from "next/navigation";
import { MEMBER_ROLES }  from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Email inválido"),
  role:  z.enum(["admin", "editor", "viewer"]),
});
type FormData = z.infer<typeof schema>;

interface Props {
  projectId: string;
  onClose:   () => void;
}

export function InviteMember({ projectId, onClose }: Props) {
  const router          = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "viewer" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar si ya es miembro
    const { data: existingRaw } = await supabase
      .from("project_members")
      .select("id, status")
      .eq("project_id", projectId)
      .eq("email", data.email)
      .single();

    const existing = existingRaw as { id: string } | null;
    if (existing) {
      setError("Este usuario ya es miembro o tiene una invitación pendiente.");
      return;
    }

    // Buscar si el usuario ya existe en la plataforma
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .single();
    const profile = profileRaw as { id: string } | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (supabase as any).from("project_members").insert({
      project_id: projectId,
      user_id:    profile?.id ?? null,
      email:      data.email,
      role:       data.role,
      status:     profile ? "activo" : "pendiente",
      invited_by: user.id,
      joined_at:  profile ? new Date().toISOString() : null,
    });

    if (insertErr) {
      setError("Error al enviar la invitación.");
      return;
    }

    setSuccess(true);
    reset();
    setTimeout(() => { setSuccess(false); router.refresh(); }, 1500);
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-brand-200" />
          <h3 className="text-sm font-semibold text-slate-100">Invitar colaborador</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {success && (
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
          ✓ Invitación enviada correctamente
        </div>
      )}
      {error && (
        <div className="mb-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="label">Email del colaborador</label>
          <input {...register("email")} type="email" placeholder="colaborador@empresa.com" className="input-field" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Rol</label>
          <select {...register("role")} className="input-field">
            {MEMBER_ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">
            <span className="text-purple-300 font-medium">Admin</span>: acceso total ·{" "}
            <span className="text-brand-200 font-medium">Editor</span>: crear y editar ·{" "}
            <span className="text-slate-300 font-medium">Visualizador</span>: solo lectura
          </p>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Invitando..." : "Enviar invitación"}
        </button>
      </form>
    </div>
  );
}

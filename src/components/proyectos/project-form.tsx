"use client";

import { useState }      from "react";
import { useForm }       from "react-hook-form";
import { zodResolver }   from "@hookform/resolvers/zod";
import { z }             from "zod";
import { useRouter }     from "next/navigation";
import { Loader2 }       from "lucide-react";
import { createClient }  from "@/lib/supabase/client";
import { PROJECT_TYPES } from "@/lib/utils";

const schema = z.object({
  name:        z.string().min(3, "Mínimo 3 caracteres").max(100),
  type:        z.enum(["electrico", "civil", "mecanico"]),
  description: z.string().max(500).optional(),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ProjectForm() {
  const router          = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "electrico" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: projectRaw, error: err } = await (supabase as any)
      .from("projects")
      .insert({
        name:        data.name,
        type:        data.type,
        description: data.description || null,
        start_date:  data.start_date  || null,
        end_date:    data.end_date    || null,
        owner_id:    user.id,
        status:      "activo",
      })
      .select("id")
      .single();

    const project = projectRaw as { id: string } | null;

    if (err || !project) {
      setError("Error al crear el proyecto. Inténtalo de nuevo.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("project_members").insert({
      project_id: project.id,
      user_id:    user.id,
      email:      user.email!,
      role:       "admin",
      status:     "activo",
      invited_by: user.id,
      joined_at:  new Date().toISOString(),
    });

    router.push(`/proyectos/${project.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-5 max-w-xl">
      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label className="label">Nombre del proyecto *</label>
        <input {...register("name")} type="text" placeholder="Ej: Planta Solar Norte" className="input-field" />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>

      {/* Tipo */}
      <div>
        <label className="label">Tipo de infraestructura *</label>
        <div className="grid grid-cols-3 gap-2">
          {PROJECT_TYPES.map(t => (
            <label key={t.value} className="cursor-pointer">
              <input {...register("type")} type="radio" value={t.value} className="sr-only peer" />
              <div className="peer-checked:border-brand-300/60 peer-checked:bg-brand-300/10 peer-checked:text-brand-100 border border-surface-border rounded-lg px-3 py-2.5 text-sm text-slate-400 text-center transition-all hover:border-surface-active hover:text-slate-200">
                {t.label}
              </div>
            </label>
          ))}
        </div>
        {errors.type && <p className="mt-1 text-xs text-red-400">{errors.type.message}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label className="label">Descripción</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe el alcance del proyecto..."
          className="input-field resize-none"
        />
        {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha inicio</label>
          <input {...register("start_date")} type="date" className="input-field" />
        </div>
        <div>
          <label className="label">Fecha fin</label>
          <input {...register("end_date")} type="date" className="input-field" />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 justify-center">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creando..." : "Crear proyecto"}
        </button>
      </div>
    </form>
  );
}

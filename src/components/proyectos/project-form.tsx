"use client";

import { useState, useRef }  from "react";
import { useForm }           from "react-hook-form";
import { zodResolver }       from "@hookform/resolvers/zod";
import { z }                 from "zod";
import { useRouter }         from "next/navigation";
import { Loader2, Upload, FileBox, X, CheckCircle } from "lucide-react";
import { createClient }      from "@/lib/supabase/client";
import { PROJECT_TYPES }     from "@/lib/utils";

const schema = z.object({
  name:        z.string().min(3, "Mínimo 3 caracteres").max(100),
  type:        z.enum(["electrico", "civil", "mecanico"]),
  description: z.string().max(500).optional(),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ProjectForm() {
  const router              = useRouter();
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const [error, setError]   = useState<string | null>(null);
  const [ifcFile, setIfc]   = useState<File | null>(null);
  const [ifcError, setIErr] = useState<string | null>(null);
  const [uploading, setUpl] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "electrico" },
  });

  function handleFileChange(file: File | null) {
    setIErr(null);
    if (!file) { setIfc(null); return; }
    if (!file.name.toLowerCase().endsWith(".ifc")) {
      setIErr("Solo se aceptan archivos .ifc");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setIErr("El archivo no puede superar 200 MB");
      return;
    }
    setIfc(file);
  }

  async function onSubmit(data: FormData) {
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // 1. Crear proyecto
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
      setError(err?.message ?? "Error al crear el proyecto. Inténtalo de nuevo.");
      return;
    }

    // 2. Agregar al owner como admin
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

    // 3. Subir modelo IFC si se seleccionó
    if (ifcFile) {
      setUpl(true);
      const form = new FormData();
      form.append("file",       ifcFile);
      form.append("project_id", project.id);
      form.append("user_id",    user.id);
      form.append("name",       ifcFile.name.replace(/\.ifc$/i, ""));
      await fetch("/api/ifc/upload", { method: "POST", body: form });
      setUpl(false);
    }

    router.push(`/proyectos/${project.id}`);
    router.refresh();
  }

  const busy = isSubmitting || uploading;

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

      {/* ── Upload modelo IFC ── */}
      <div className="border-t border-surface-border pt-5">
        <label className="label mb-2 flex items-center gap-1.5">
          <FileBox className="w-3.5 h-3.5 text-brand-300" />
          Modelo IFC
          <span className="text-slate-600 font-normal ml-1">(opcional)</span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept=".ifc"
          className="hidden"
          onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
        />

        {!ifcFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0] ?? null); }}
            className="border-2 border-dashed border-surface-border rounded-xl p-6 text-center cursor-pointer hover:border-brand-300/50 hover:bg-brand-300/5 transition-all"
          >
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Arrastra tu archivo <span className="text-brand-200 font-medium">.ifc</span> aquí</p>
            <p className="text-xs text-slate-600 mt-1">o haz clic para seleccionar · máx. 200 MB</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-300/10 border border-brand-300/20">
            <CheckCircle className="w-5 h-5 text-brand-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{ifcFile.name}</p>
              <p className="text-xs text-slate-500">{(ifcFile.size / 1024 / 1024).toFixed(2)} MB · Se subirá al crear el proyecto</p>
            </div>
            <button
              type="button"
              onClick={() => { setIfc(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="btn-ghost p-1.5 text-slate-500 hover:text-slate-200 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {ifcError && <p className="mt-1.5 text-xs text-red-400">{ifcError}</p>}

        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-brand-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Subiendo modelo IFC...
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 justify-center">
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {uploading ? "Subiendo modelo..." : isSubmitting ? "Creando..." : "Crear proyecto"}
        </button>
      </div>
    </form>
  );
}

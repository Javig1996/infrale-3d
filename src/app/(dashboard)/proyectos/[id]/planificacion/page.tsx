import { createClient }  from "@/lib/supabase/server";
import { notFound }      from "next/navigation";
import Link              from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { ProgressClient } from "@/components/planificacion/progress-client";

interface Props { params: { id: string } }

export default async function PlanificacionPage({ params }: Props) {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projectRaw } = await (supabase as any)
    .from("projects")
    .select("id, name, type")
    .eq("id", params.id)
    .single();

  if (!projectRaw) notFound();
  const project = projectRaw as { id: string; name: string; type: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: elementsRaw } = await (supabase as any)
    .from("model_elements")
    .select(`
      id, name, element_type, ifc_guid,
      element_progress (progress_percentage, status, notes, updated_at)
    `)
    .eq("project_id", params.id)
    .order("element_type");

  type ElementRow = {
    id: string; name: string; element_type: string; ifc_guid: string;
    element_progress: { progress_percentage: number; status: string; notes: string; updated_at: string }[];
  };
  const elements = (elementsRaw ?? []) as ElementRow[];

  const totalProgress = elements.length
    ? Math.round(elements.reduce((acc, el) => {
        const p = el.element_progress?.[0]?.progress_percentage ?? 0;
        return acc + p;
      }, 0) / elements.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-300" />
            Control de Avance
          </h1>
          <p className="text-sm text-slate-500">{project.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-200">{totalProgress}%</p>
            <p className="text-xs text-slate-500">Avance global</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso global */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Progreso total del proyecto</span>
          <span className="text-sm font-bold text-brand-200">{totalProgress}%</span>
        </div>
        <div className="w-full bg-surface-border rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-brand-300 to-cyan-400 transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">{elements.length} elementos registrados</p>
      </div>

      {/* Lista de elementos */}
      <ProgressClient projectId={params.id} elements={elements} />
    </div>
  );
}

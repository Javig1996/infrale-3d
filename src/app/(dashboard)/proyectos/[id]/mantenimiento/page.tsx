import { createClient }    from "@/lib/supabase/server";
import { notFound }        from "next/navigation";
import Link                from "next/link";
import { ArrowLeft, Bell } from "lucide-react";
import { MantenimientoClient } from "@/components/mantenimiento/mantenimiento-client";

interface Props { params: { id: string } }

export default async function MantenimientoPage({ params }: Props) {
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
  const { data: recordsRaw } = await (supabase as any)
    .from("maintenance_records")
    .select(`
      id, title, description, type, status, priority,
      scheduled_date, completed_date, next_maintenance_date,
      alert_email, created_at,
      model_elements (id, name, element_type)
    `)
    .eq("project_id", params.id)
    .order("scheduled_date", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: elementsRaw } = await (supabase as any)
    .from("model_elements")
    .select("id, name, element_type")
    .eq("project_id", params.id)
    .order("name");

  type MaintRecord = {
    id: string; title: string; description: string; type: string; status: string; priority: string;
    scheduled_date: string; completed_date: string | null; next_maintenance_date: string | null;
    alert_email: string | null; created_at: string;
    model_elements: { id: string; name: string; element_type: string } | null;
  };
  type ElementBasic = { id: string; name: string; element_type: string };

  const records  = (recordsRaw ?? [])  as MaintRecord[];
  const elements = (elementsRaw ?? []) as ElementBasic[];

  const stats = {
    total:     records.length,
    pending:   records.filter(r => r.status === "pendiente").length,
    overdue:   records.filter(r => r.status === "pendiente" && new Date(r.scheduled_date) < new Date()).length,
    completed: records.filter(r => r.status === "completado").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/proyectos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-300" />
            Mantenimiento
          </h1>
          <p className="text-sm text-slate-500">{project.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",      value: stats.total,     color: "text-slate-200" },
          { label: "Pendientes", value: stats.pending,   color: "text-yellow-400" },
          { label: "Vencidos",   value: stats.overdue,   color: "text-red-400" },
          { label: "Completados",value: stats.completed, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <MantenimientoClient projectId={params.id} records={records} elements={elements} />
    </div>
  );
}

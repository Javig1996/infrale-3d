import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import {
  FolderKanban, Box, FileText, Wrench,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Bell,
} from "lucide-react";
import Link            from "next/link";
import { formatDate }  from "@/lib/utils";
import type { Project } from "@/types/database";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export const metadata = { title: "Dashboard — Infrale 3D" };

const STATUS_CONFIG = {
  activo:     { label: "Activo",     icon: CheckCircle2,  color: "text-green-400" },
  pausado:    { label: "Pausado",    icon: Clock,         color: "text-yellow-400" },
  completado: { label: "Completado", icon: TrendingUp,    color: "text-brand-200" },
  archivado:  { label: "Archivado",  icon: AlertTriangle, color: "text-slate-500" },
} as const;

const TYPE_LABELS: Record<string, string> = {
  electrico: "Eléctrico", civil: "Civil", mecanico: "Mecánico",
};
const TYPE_BADGE: Record<string, string> = {
  electrico: "badge-electrico", civil: "badge-civil", mecanico: "badge-mecanico",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { count: projectCount },
    { count: ifcCount },
    { count: docCount },
    { data: recentRaw },
    { data: maintRaw },
    { data: progressRaw },
  ] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("ifc_models").select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("element_documents").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("id, name, type, status, created_at").order("created_at", { ascending: false }).limit(6),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("maintenance_records")
      .select("id, title, scheduled_date, priority, status, projects(name)")
      .eq("status", "pendiente")
      .lte("scheduled_date", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0])
      .order("scheduled_date", { ascending: true })
      .limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("element_progress")
      .select("status")
      .limit(200),
  ]);

  const recentProjects = (recentRaw ?? []) as Pick<Project, "id" | "name" | "type" | "status" | "created_at">[];

  type MaintItem = { id: string; title: string; scheduled_date: string; priority: string; status: string; projects: { name: string } | null };
  const upcoming = (maintRaw ?? []) as MaintItem[];

  type ProgressRow = { status: string };
  const progRows = (progressRaw ?? []) as ProgressRow[];
  const progByStatus = progRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
  }, {});

  const typeCount = recentProjects.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + 1; return acc;
  }, {});

  const stats = [
    { label: "Proyectos",      value: projectCount ?? 0, icon: FolderKanban, color: "text-brand-200",  bg: "bg-brand-300/10 border-brand-300/20", href: "/proyectos" },
    { label: "Modelos IFC",    value: ifcCount ?? 0,     icon: Box,          color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20",   href: "/proyectos" },
    { label: "Documentos",     value: docCount ?? 0,     icon: FileText,     color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20", href: "/proyectos" },
    { label: "Mant. próximos", value: upcoming.length,   icon: Bell,         color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20",href: "/proyectos" },
  ];

  const chartData = {
    progressByStatus: [
      { name: "Pendiente",   value: progByStatus["pendiente"]   ?? 0, fill: "#64748b" },
      { name: "En progreso", value: progByStatus["en_progreso"] ?? 0, fill: "#2563eb" },
      { name: "Completado",  value: progByStatus["completado"]  ?? 0, fill: "#22c55e" },
      { name: "Bloqueado",   value: progByStatus["bloqueado"]   ?? 0, fill: "#ef4444" },
    ],
    byType: [
      { name: "Eléctrico", value: typeCount["electrico"] ?? 0, fill: "#2563eb" },
      { name: "Civil",     value: typeCount["civil"]     ?? 0, fill: "#00d4ff" },
      { name: "Mecánico",  value: typeCount["mecanico"]  ?? 0, fill: "#a855f7" },
    ],
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Visión general de tus infraestructuras 3D</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="glass-card glass-card-hover p-4 flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100 font-mono">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gráficos */}
      <DashboardCharts data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proyectos recientes */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Proyectos recientes</h2>
            <Link href="/proyectos" className="text-xs text-brand-200 hover:text-cyan-300 transition-colors">Ver todos →</Link>
          </div>
          {!recentProjects.length ? (
            <div className="px-5 py-10 text-center">
              <FolderKanban className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-3">Aún no tienes proyectos</p>
              <Link href="/proyectos/nuevo" className="btn-primary inline-flex text-sm">Crear proyecto</Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {recentProjects.map(project => {
                const cfg = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.activo;
                const StatusIcon = cfg.icon;
                return (
                  <Link key={project.id} href={`/proyectos/${project.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-hover transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(project.created_at)}</p>
                    </div>
                    <span className={`${TYPE_BADGE[project.type] ?? "badge-viewer"} text-xs`}>{TYPE_LABELS[project.type] ?? project.type}</span>
                    <div className={`flex items-center gap-1 text-xs ${cfg.color} shrink-0`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Mantenimientos próximos */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" /> Mantenimientos próximos
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Sin mantenimientos urgentes</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {upcoming.map(m => {
                const isOver  = new Date(m.scheduled_date) < new Date();
                const prioClr = { critica: "text-red-400", alta: "text-orange-400", media: "text-yellow-400", baja: "text-slate-400" }[m.priority] ?? "text-slate-400";
                return (
                  <div key={m.id} className="px-5 py-3 flex items-start gap-3">
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isOver ? "text-red-400" : "text-orange-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{m.title}</p>
                      <p className="text-xs text-slate-500">{m.projects?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${isOver ? "text-red-400" : "text-slate-400"}`}>
                        {isOver ? "Vencido" : formatDate(m.scheduled_date)}
                      </p>
                      <p className={`text-[10px] ${prioClr}`}>{m.priority}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

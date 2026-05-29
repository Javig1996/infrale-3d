import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import {
  FolderKanban, Box, FileText, Wrench,
  TrendingUp, CheckCircle2, Clock, AlertTriangle, Bell,
  ArrowUpRight,
} from "lucide-react";
import Link            from "next/link";
import { formatDate }  from "@/lib/utils";
import type { Project } from "@/types/database";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export const metadata = { title: "Dashboard — Infrale 3D" };

const STATUS_CONFIG = {
  activo:     { label: "Activo",     icon: CheckCircle2,  color: "text-green-400",  dot: "bg-green-400" },
  pausado:    { label: "Pausado",    icon: Clock,         color: "text-yellow-400", dot: "bg-yellow-400" },
  completado: { label: "Completado", icon: TrendingUp,    color: "text-brand-200",  dot: "bg-brand-200" },
  archivado:  { label: "Archivado",  icon: AlertTriangle, color: "text-slate-500",  dot: "bg-slate-500" },
} as const;

const TYPE_LABELS: Record<string, string> = {
  electrico: "Eléctrico", civil: "Civil", mecanico: "Mecánico",
};
const TYPE_BADGE: Record<string, string> = {
  electrico: "badge-electrico", civil: "badge-civil", mecanico: "badge-mecanico",
};
const PRIO_COLOR: Record<string, string> = {
  critica: "text-red-400", alta: "text-orange-400", media: "text-yellow-400", baja: "text-slate-400",
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
    {
      label: "Proyectos",
      value: projectCount ?? 0,
      icon:  FolderKanban,
      color: "text-brand-200",
      bg:    "bg-brand-300/10 border-brand-300/20",
      href:  "/proyectos",
      desc:  "en total",
    },
    {
      label: "Modelos IFC",
      value: ifcCount ?? 0,
      icon:  Box,
      color: "text-cyan-400",
      bg:    "bg-cyan-400/10 border-cyan-400/20",
      href:  "/proyectos",
      desc:  "cargados",
    },
    {
      label: "Documentos",
      value: docCount ?? 0,
      icon:  FileText,
      color: "text-green-400",
      bg:    "bg-green-400/10 border-green-400/20",
      href:  "/proyectos",
      desc:  "almacenados",
    },
    {
      label: "Alertas",
      value: upcoming.length,
      icon:  Bell,
      color: upcoming.length > 0 ? "text-orange-400" : "text-slate-500",
      bg:    upcoming.length > 0 ? "bg-orange-400/10 border-orange-400/20" : "bg-surface-hover border-surface-border",
      href:  "/proyectos",
      desc:  "esta semana",
    },
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
    <div className="space-y-6 max-w-7xl">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visión general de tus infraestructuras 3D</p>
        </div>
        <Link href="/proyectos/nuevo" className="btn-primary shrink-0">
          <FolderKanban className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo proyecto</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass-card glass-card-hover p-4 flex items-center gap-3 group"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-110 ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-100 font-mono tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {stat.label}
                </p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 ml-auto self-start mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </div>

      {/* Gráficos */}
      <DashboardCharts data={chartData} />

      {/* Tablas inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Proyectos recientes */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
            <h2 className="section-heading flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-200" />
              Proyectos recientes
            </h2>
            <Link
              href="/proyectos"
              className="text-xs text-slate-500 hover:text-brand-200 transition-colors flex items-center gap-1"
            >
              Ver todos
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {!recentProjects.length ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderKanban className="w-5 h-5 text-slate-500" />
              </div>
              <p className="empty-state-title">Sin proyectos aún</p>
              <p className="empty-state-desc">Crea tu primer proyecto para comenzar a gestionar infraestructuras 3D.</p>
              <Link href="/proyectos/nuevo" className="btn-primary">
                Crear proyecto
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {recentProjects.map(project => {
                const cfg        = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.activo;
                return (
                  <Link
                    key={project.id}
                    href={`/proyectos/${project.id}`}
                    className="table-row group"
                  >
                    <span className={`status-dot ${cfg.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(project.created_at)}</p>
                    </div>
                    <span className={`${TYPE_BADGE[project.type] ?? "badge-viewer"} shrink-0`}>
                      {TYPE_LABELS[project.type] ?? project.type}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Mantenimientos próximos */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between">
            <h2 className="section-heading flex items-center gap-2">
              <Bell className={`w-4 h-4 ${upcoming.length > 0 ? "text-orange-400" : "text-slate-500"}`} />
              Mantenimientos próximos
              {upcoming.length > 0 && (
                <span className="chip-warning py-0 px-1.5 text-[10px]">{upcoming.length}</span>
              )}
            </h2>
          </div>

          {upcoming.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Wrench className="w-5 h-5 text-slate-500" />
              </div>
              <p className="empty-state-title">Sin alertas urgentes</p>
              <p className="empty-state-desc">No hay mantenimientos pendientes para los próximos 7 días.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {upcoming.map(m => {
                const isOver  = new Date(m.scheduled_date) < new Date();
                const prioClr = PRIO_COLOR[m.priority] ?? "text-slate-400";
                return (
                  <div key={m.id} className="table-row">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isOver ? "text-red-400" : "text-orange-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{m.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.projects?.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${isOver ? "text-red-400" : "text-slate-400"}`}>
                        {isOver ? "Vencido" : formatDate(m.scheduled_date)}
                      </p>
                      <p className={`text-[10px] mt-0.5 capitalize ${prioClr}`}>{m.priority}</p>
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

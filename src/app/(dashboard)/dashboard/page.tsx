import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import {
  FolderKanban, Box, FileText, Wrench,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types/database";

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

  const [{ count: projectCount }, { data: recentRaw }] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("projects")
      .select("id, name, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const recentProjects = (recentRaw ?? []) as Pick<Project, "id" | "name" | "type" | "status" | "created_at">[];

  const stats = [
    { label: "Proyectos activos", value: projectCount ?? 0, icon: FolderKanban, color: "text-brand-200",  bg: "bg-brand-300/10 border-brand-300/20", href: "/proyectos" },
    { label: "Modelos IFC",       value: 0,                 icon: Box,          color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20",   href: "/proyectos" },
    { label: "Documentos",        value: 0,                 icon: FileText,     color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20", href: "/proyectos" },
    { label: "Mant. próximos",    value: 0,                 icon: Wrench,       color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", href: "/mantenimiento" },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Visión general de tus infraestructuras 3D</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="stat-card group cursor-pointer glass-card-hover">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100 font-mono">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Proyectos recientes */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Proyectos recientes</h2>
          <Link href="/proyectos" className="text-xs text-brand-200 hover:text-cyan-300 transition-colors">Ver todos →</Link>
        </div>
        {!recentProjects.length ? (
          <div className="px-5 py-12 text-center">
            <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aún no tienes proyectos</p>
            <Link href="/proyectos/nuevo" className="btn-primary mt-4 inline-flex">Crear primer proyecto</Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentProjects.map(project => {
              const cfg     = STATUS_CONFIG[project.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.activo;
              const StatusIcon = cfg.icon;
              return (
                <Link key={project.id} href={`/proyectos/${project.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{project.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(project.created_at)}</p>
                  </div>
                  <span className={TYPE_BADGE[project.type] ?? "badge-viewer"}>{TYPE_LABELS[project.type] ?? project.type}</span>
                  <div className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card p-5 border-brand-300/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-300/10 border border-brand-300/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-200" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Módulos en desarrollo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El visor 3D IFC, control de avance, operación y mantenimiento estarán disponibles en las siguientes fases.
              Por ahora puedes crear proyectos e invitar colaboradores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

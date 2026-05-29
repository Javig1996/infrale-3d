import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import {
  Plus, FolderKanban, Users, Box,
  Calendar, ArrowUpRight,
} from "lucide-react";
import { formatDate, getProjectTypeBadge } from "@/lib/utils";
import type { Project } from "@/types/database";

export const metadata = { title: "Proyectos — Infrale 3D" };

const STATUS_CONFIG: Record<string, { label: string; dot: string; chip: string }> = {
  activo:     { label: "Activo",     dot: "bg-green-400",  chip: "chip-success" },
  pausado:    { label: "Pausado",    dot: "bg-yellow-400", chip: "chip-warning" },
  completado: { label: "Completado", dot: "bg-brand-200",  chip: "chip-active" },
  archivado:  { label: "Archivado",  dot: "bg-slate-500",  chip: "chip-default" },
};

type ProjectRow = Pick<Project, "id" | "name" | "type" | "description" | "status" | "start_date" | "end_date" | "created_at">;
type ProjectWithRole = ProjectRow & { my_role: string; is_owner: boolean };

export default async function ProyectosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ownRaw } = await supabase
    .from("projects")
    .select("id, name, type, description, status, start_date, end_date, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: memberRows } = await supabase
    .from("project_members")
    .select("role, projects(id, name, type, description, status, start_date, end_date, created_at)")
    .eq("user_id", user.id)
    .eq("status", "activo");

  const ownProjects: ProjectWithRole[] = ((ownRaw ?? []) as ProjectRow[]).map(p => ({
    ...p, my_role: "admin", is_owner: true,
  }));

  type MemberRowRaw = { role: string; projects: ProjectRow | null };
  const memberProjects: ProjectWithRole[] = ((memberRows ?? []) as unknown as MemberRowRaw[])
    .filter(r => r.projects)
    .map(r => ({ ...(r.projects as ProjectRow), my_role: r.role, is_owner: false }));

  const allProjects = [...ownProjects, ...memberProjects];

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="page-subtitle">
            {allProjects.length === 0
              ? "Crea tu primer proyecto para comenzar"
              : `${allProjects.length} proyecto${allProjects.length !== 1 ? "s" : ""} en total`}
          </p>
        </div>
        <Link href="/proyectos/nuevo" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo proyecto</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* Empty state */}
      {allProjects.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderKanban className="w-5 h-5 text-slate-500" />
            </div>
            <p className="empty-state-title">Sin proyectos aún</p>
            <p className="empty-state-desc">
              Crea tu primer proyecto para comenzar a gestionar infraestructuras 3D con modelos BIM.
            </p>
            <Link href="/proyectos/nuevo" className="btn-primary">
              <Plus className="w-4 h-4" />
              Crear proyecto
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {allProjects.map(project => {
            const typeMeta  = getProjectTypeBadge(project.type);
            const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.activo;

            return (
              <Link
                key={project.id}
                href={`/proyectos/${project.id}`}
                className="glass-card-hover p-5 flex flex-col gap-3 group"
              >
                {/* Header tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors leading-tight">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </div>

                {/* Badges de tipo y estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={typeMeta.color}>{typeMeta.label}</span>
                  <span className={statusCfg.chip}>
                    <span className={`status-dot ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>

                {/* Footer tarjeta */}
                <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {project.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.start_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Box className="w-3 h-3" />
                      0 modelos
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    {project.is_owner ? "Propietario" : project.my_role}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

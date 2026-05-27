import { createClient }  from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import { Plus, FolderKanban, Users, Box, Calendar } from "lucide-react";
import { formatDate, getProjectTypeBadge } from "@/lib/utils";
import type { Project } from "@/types/database";

export const metadata = { title: "Proyectos — Infrale 3D" };

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  activo:     { label: "Activo",     dot: "bg-green-400" },
  pausado:    { label: "Pausado",    dot: "bg-yellow-400" },
  completado: { label: "Completado", dot: "bg-brand-200" },
  archivado:  { label: "Archivado",  dot: "bg-slate-500" },
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
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Proyectos</h1>
          <p className="text-sm text-slate-500 mt-1">{allProjects.length} proyecto{allProjects.length !== 1 ? "s" : ""} en total</p>
        </div>
        <Link href="/proyectos/nuevo" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Link>
      </div>

      {allProjects.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-slate-300 mb-2">Sin proyectos aún</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Crea tu primer proyecto para comenzar a gestionar infraestructuras 3D.
          </p>
          <Link href="/proyectos/nuevo" className="btn-primary">
            <Plus className="w-4 h-4" />
            Crear proyecto
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {allProjects.map(project => {
            const typeMeta  = getProjectTypeBadge(project.type);
            const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.activo;
            return (
              <Link key={project.id} href={`/proyectos/${project.id}`} className="glass-card-hover p-5 flex flex-col gap-4 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">{project.name}</h3>
                    {project.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project.description}</p>}
                  </div>
                  <span className={typeMeta.color}>{typeMeta.label}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className={`status-dot ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                  {project.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.start_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-surface-border">
                  <span className="flex items-center gap-1 text-xs text-slate-500"><Box className="w-3 h-3" />0 modelos</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><Users className="w-3 h-3" />{project.is_owner ? "Propietario" : project.my_role}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { createClient }        from "@/lib/supabase/server";
import { redirect, notFound }  from "next/navigation";
import Link                    from "next/link";
import {
  ArrowLeft, Box, Users, Calendar, FileText,
  Wrench, TrendingUp, Eye,
} from "lucide-react";
import { formatDate, getProjectTypeBadge, getRoleBadge } from "@/lib/utils";
import { ProjectActions }      from "@/components/proyectos/project-actions";
import { IFCUpload }           from "@/components/ifc/ifc-upload";
import type { Project }        from "@/types/database";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", params.id).single();
  const project  = data as Pick<Project, "name"> | null;
  return { title: project ? `${project.name} — Infrale 3D` : "Proyecto — Infrale 3D" };
}

const MODULE_CARDS = [
  { href: "planificacion", label: "Control de Avance", icon: TrendingUp, desc: "Seguimiento de progreso por elemento", color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20"   },
  { href: "operacion",     label: "Operación",          icon: FileText,   desc: "Fichas técnicas y documentación",    color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20"     },
  { href: "mantenimiento", label: "Mantenimiento",      icon: Wrench,     desc: "Registros, alertas y programación", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
];

const STATUS_DOT: Record<string, string> = {
  activo: "bg-green-400", pausado: "bg-yellow-400",
  completado: "bg-brand-200", archivado: "bg-slate-500",
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projectRaw } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!projectRaw) notFound();
  const project = projectRaw as Project;

  const isOwner = project.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("id, role")
      .eq("project_id", params.id)
      .eq("user_id", user.id)
      .eq("status", "activo")
      .single();
    if (!membership) redirect("/proyectos");
  }

  const [{ data: membersRaw }, { data: modelsRaw }] = await Promise.all([
    supabase
      .from("project_members")
      .select("id, email, role, status, invited_at, joined_at, user_id, profiles(full_name, avatar_url)")
      .eq("project_id", params.id)
      .order("invited_at", { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("ifc_models")
      .select("id, filename, r2_url, size_bytes, uploaded_at")
      .eq("project_id", params.id)
      .order("uploaded_at", { ascending: false }),
  ]);

  type MemberWithProfile = {
    id: string; email: string; role: string; status: string;
    invited_at: string; joined_at: string | null; user_id: string | null;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  };
  type IFCModelRow = { id: string; filename: string; r2_url: string; size_bytes: number | null; uploaded_at: string };

  const members = (membersRaw ?? []) as unknown as MemberWithProfile[];
  const models  = (modelsRaw  ?? []) as IFCModelRow[];

  const typeMeta  = getProjectTypeBadge(project.type);
  const canEdit   = isOwner || members.some(m => m.user_id === user.id && (m.role === "admin" || m.role === "editor") && m.status === "activo");
  const canDelete = isOwner || members.some(m => m.user_id === user.id && m.role === "admin" && m.status === "activo");

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/proyectos" className="btn-ghost -ml-2 mb-3 inline-flex text-xs">
            <ArrowLeft className="w-3 h-3" /> Proyectos
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
            <span className={typeMeta.color}>{typeMeta.label}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`status-dot ${STATUS_DOT[project.status] ?? "bg-slate-500"}`} />
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>
        {canDelete && <ProjectActions projectId={project.id} isOwner={isOwner} />}
      </div>

      {/* Fechas */}
      {(project.start_date || project.end_date) && (
        <div className="flex gap-4 text-xs text-slate-500">
          {project.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Inicio: <span className="text-slate-300 ml-1">{formatDate(project.start_date)}</span>
            </span>
          )}
          {project.end_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Fin: <span className="text-slate-300 ml-1">{formatDate(project.end_date)}</span>
            </span>
          )}
        </div>
      )}

      {/* Módulos */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Módulos</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {MODULE_CARDS.map(m => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={`/proyectos/${params.id}/${m.href}`} className="glass-card glass-card-hover p-4 flex flex-col gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${m.bg}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Modelos IFC */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
            <Box className="w-4 h-4 text-brand-200" />
            <h3 className="text-sm font-semibold text-slate-200">Modelos IFC</h3>
            <span className="text-xs text-slate-500 font-mono">({models.length})</span>
          </div>

          {canEdit && (
            <div className="p-4 border-b border-surface-border">
              <IFCUpload projectId={params.id} />
            </div>
          )}

          {!models.length ? (
            <div className="px-5 py-8 text-center">
              <Box className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Sin modelos cargados</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {models.map(m => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-3 group hover:bg-surface-hover transition-colors">
                  <Box className="w-4 h-4 text-brand-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{m.filename}</p>
                    <p className="text-xs text-slate-500">{formatDate(m.uploaded_at)}</p>
                  </div>
                  {m.size_bytes && (
                    <span className="text-xs text-slate-500 font-mono">
                      {(m.size_bytes / 1_048_576).toFixed(1)} MB
                    </span>
                  )}
                  <Link href={`/proyectos/${params.id}/visor/${m.id}`}
                    className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-200">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Colaboradores */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Colaboradores</h3>
            <span className="text-xs text-slate-500 font-mono">({members.length})</span>
          </div>
          <div className="divide-y divide-surface-border">
            {members.map(member => {
              const roleMeta = getRoleBadge(member.role);
              const name     = member.profiles?.full_name ?? member.email.split("@")[0];
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={member.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={roleMeta.class}>{roleMeta.label}</span>
                    {member.status === "pendiente" && (
                      <span className="text-[10px] text-yellow-400">Pendiente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

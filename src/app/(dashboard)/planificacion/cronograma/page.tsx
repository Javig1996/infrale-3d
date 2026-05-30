"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Download, AlertCircle, FolderOpen, AlertTriangle, Users } from "lucide-react";
import { createClient }    from "@/lib/supabase/client";
import { computeCriticalPath } from "@/lib/cpm";
import { GanttChart }          from "@/components/gantt/gantt-chart";
import { ActivityModal, type ActivityFormData, type MemberOption, type ActivityOption }
  from "@/components/gantt/activity-modal";
import type { ScheduleActivity, ScheduleMember, Project } from "@/types/database";

// ── Tipos locales ────────────────────────────────────────────────────────────
type ActivityRow = ScheduleActivity & { member_name?: string };

// ── Helpers ──────────────────────────────────────────────────────────────────
function dateDiff(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

function totalWeeks(activities: ScheduleActivity[]): number {
  if (!activities.length) return 0;
  const starts = activities.map(a => new Date(a.start_date).getTime());
  const ends   = activities.map(a => new Date(a.end_date).getTime());
  const days   = dateDiff(new Date(Math.min(...starts)), new Date(Math.max(...ends)));
  return Math.ceil(days / 7);
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function CronogramaPage() {
  const supabase = createClient();

  // Estado global
  const [projects,  setProjects]  = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [activities,setActivities]= useState<ActivityRow[]>([]);
  const [members,   setMembers]   = useState<ScheduleMember[]>([]);
  const [ifcUrl,    setIfcUrl]    = useState<string | null>(null);
  const [ifcName,   setIfcName]   = useState<string>("");
  const [loading,   setLoading]   = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [editData,  setEditData]  = useState<Partial<ActivityFormData> | undefined>();

  // Visor + selección
  const viewerRef = useRef<HTMLIFrameElement>(null);
  const pendingCb = useRef<((name: string) => void) | null>(null);

  // ── Cargar proyectos al montar ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("projects")
        .select("id,name,status")
        .or(`owner_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) setProjects(data as Project[]);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cargar datos cuando cambia proyecto ──────────────────────────────────
  useEffect(() => {
    if (!projectId) { setActivities([]); setMembers([]); setIfcUrl(null); return; }
    loadProjectData(projectId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadProjectData(pid: string) {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const [{ data: acts }, { data: mems }, { data: models }] = await Promise.all([
        sb.from("schedule_activities")
          .select("*")
          .eq("project_id", pid)
          .order("start_date"),
        sb.from("schedule_members")
          .select("*")
          .eq("project_id", pid)
          .order("name"),
        sb.from("ifc_models")
          .select("r2_url,filename")
          .eq("project_id", pid)
          .limit(1),
      ]);

      const memberMap = new Map<string, string>(
        ((mems ?? []) as ScheduleMember[]).map(m => [m.id, m.name])
      );

      const rows: ActivityRow[] = ((acts ?? []) as ScheduleActivity[]).map(a => ({
        ...a,
        member_name: a.member_id ? memberMap.get(a.member_id) : undefined,
      }));

      setActivities(rows);
      setMembers((mems ?? []) as ScheduleMember[]);
      if (models?.[0]) { setIfcUrl(models[0].r2_url); setIfcName(models[0].filename); }
      else             { setIfcUrl(null); setIfcName(""); }
    } finally {
      setLoading(false);
    }
  }

  // ── Calcular ruta crítica ─────────────────────────────────────────────────
  const criticalIds = computeCriticalPath(
    activities.map(a => ({
      id: a.id, start_date: a.start_date, end_date: a.end_date,
      predecessors: a.predecessors ?? [],
    }))
  );

  const activitiesWithCritical: ActivityRow[] = activities.map(a => ({
    ...a, is_critical: criticalIds.has(a.id),
  }));

  const criticalList = activitiesWithCritical.filter(a => a.is_critical);

  // ── Listener de mensajes del visor (selección de elemento) ───────────────
  useEffect(() => {
    function handleMsg(e: MessageEvent) {
      if (e.data?.type === "ELEMENT_SELECTED" && pendingCb.current) {
        pendingCb.current(e.data.name ?? "");
        pendingCb.current = null;
      }
    }
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  const requestElementSelection = useCallback((cb: (name: string) => void) => {
    pendingCb.current = cb;
    viewerRef.current?.contentWindow?.postMessage({ type: "ENTER_SELECTION_MODE" }, "*");
  }, []);

  function hoverElement(name: string | null) {
    viewerRef.current?.contentWindow?.postMessage({ type: "HIGHLIGHT_ELEMENT", name }, "*");
  }

  // ── CRUD actividades ──────────────────────────────────────────────────────
  async function handleSaveActivity(data: ActivityFormData, id?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !projectId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const payload = {
      project_id:   projectId,
      name:         data.name,
      start_date:   data.start_date,
      end_date:     data.end_date,
      member_id:    data.member_id   || null,
      element_name: data.element_name || null,
      predecessors: data.predecessors,
      parent_id:    data.parent_id   || null,
      is_critical:  false,
      created_by:   user.id,
    };

    if (id) {
      await sb.from("schedule_activities").update(payload).eq("id", id);
    } else {
      await sb.from("schedule_activities").insert(payload);
    }
    await loadProjectData(projectId);
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("¿Eliminar esta actividad?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("schedule_activities").delete().eq("id", id);
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  function openNewModal() {
    setEditId(null); setEditData(undefined); setModalOpen(true);
  }

  function openEditModal(id: string) {
    const act = activities.find(a => a.id === id);
    if (!act) return;
    setEditId(id);
    setEditData({
      name:         act.name,
      start_date:   act.start_date,
      end_date:     act.end_date,
      element_name: act.element_name ?? "",
      member_id:    act.member_id    ?? "",
      predecessors: act.predecessors ?? [],
      parent_id:    act.parent_id    ?? "",
    });
    setModalOpen(true);
  }

  // ── Exportar Excel ────────────────────────────────────────────────────────
  async function handleExport() {
    const XLSX = await import("xlsx");
    const memberMap = new Map(members.map(m => [m.id, m.name]));
    const idToName  = new Map(activities.map(a => [a.id, a.name]));

    const rows = activitiesWithCritical.map(a => ({
      "Actividad":       a.name,
      "Inicio":          a.start_date,
      "Fin":             a.end_date,
      "Duración (días)": Math.max(0, Math.round(
        (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) / 86_400_000
      )),
      "Responsable":     a.member_id ? (memberMap.get(a.member_id) ?? "") : "",
      "Elemento 3D":     a.element_name ?? "",
      "Predecesoras":    (a.predecessors ?? [])
        .map(pid => idToName.get(pid) ?? pid).join(", "),
      "Ruta crítica":    a.is_critical ? "Sí" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Ancho de columnas
    ws["!cols"] = [
      { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
      { wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
    const pName = projects.find(p => p.id === projectId)?.name ?? "proyecto";
    XLSX.writeFile(wb, `cronograma-${pName.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
  }

  // ── Opciones para el modal ────────────────────────────────────────────────
  const memberOptions: MemberOption[] = members.map(m => ({
    id: m.id, name: m.name, role: m.role,
  }));
  const activityOptions: ActivityOption[] = activities.map(a => ({
    id: a.id, name: a.name, parent_id: a.parent_id,
  }));

  const weeks = totalWeeks(activities);
  const viewerSrc = ifcUrl
    ? `/ifc-viewer/index.html?url=${encodeURIComponent(ifcUrl)}&name=${encodeURIComponent(ifcName)}`
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-5 gap-4">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Cronograma de obra</h1>
          <p className="page-subtitle">
            {activities.length
              ? "Pasa el cursor sobre una actividad para resaltar sus elementos en el modelo"
              : "Selecciona un proyecto y agrega actividades para construir el cronograma"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openNewModal}
            disabled={!projectId}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Nueva actividad
          </button>
          <button
            onClick={handleExport}
            disabled={!activities.length}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm border border-surface-border disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Selector de proyecto */}
      <div className="flex items-center gap-3">
        <FolderOpen className="w-4 h-4 text-slate-500 shrink-0" />
        <select
          className="input-field max-w-sm"
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
        >
          <option value="">— Selecciona un proyecto —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {projectId && members.length === 0 && (
          <span className="flex items-center gap-1 text-xs text-yellow-500">
            <AlertTriangle className="w-3.5 h-3.5" />
            Sin miembros — agrega desde &quot;Asignación de equipo&quot;
          </span>
        )}
      </div>

      {/* Cuerpo principal */}
      {!projectId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Selecciona un proyecto para ver el cronograma</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-brand-300/30 border-t-brand-300 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

          {/* ── Panel izquierdo: Gantt ── */}
          <div className="flex-1 glass-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
              <h2 className="text-sm font-semibold text-slate-200">
                Diagrama de Gantt
                {weeks > 0 && (
                  <span className="ml-2 text-xs font-normal text-slate-500">· {weeks} semanas</span>
                )}
              </h2>
              {activities.length > 0 && (
                <span className="text-[11px] text-slate-500">
                  {activities.length} actividad{activities.length !== 1 ? "es" : ""}
                </span>
              )}
            </div>

            <GanttChart
              activities={activitiesWithCritical}
              onEdit={openEditModal}
              onDelete={handleDeleteActivity}
              onHoverElement={hoverElement}
            />
          </div>

          {/* ── Panel derecho: Visor 3D + Ruta crítica ── */}
          <div className="w-full lg:w-[420px] xl:w-[480px] shrink-0 flex flex-col gap-4">

            {/* Visor 4D */}
            <div className="glass-card p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border">
                <span className="text-xs font-semibold text-slate-300">Vista 4D</span>
                {ifcName && (
                  <span className="text-[11px] text-slate-600 truncate">{ifcName}</span>
                )}
              </div>
              {viewerSrc ? (
                <iframe
                  ref={viewerRef}
                  src={viewerSrc}
                  className="w-full"
                  style={{ height: 280 }}
                  title="Visor IFC — Vista 4D"
                />
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-slate-600 gap-2 p-4">
                  <AlertCircle className="w-7 h-7 opacity-40" />
                  <p className="text-xs text-center">
                    Sin modelo 3D. Sube un archivo IFC desde la página del proyecto.
                  </p>
                </div>
              )}
            </div>

            {/* Ruta crítica */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Ruta crítica
                </h3>
              </div>

              {criticalList.length === 0 ? (
                <p className="text-xs text-slate-600">
                  {activities.length === 0
                    ? "Agrega actividades con dependencias para calcular la ruta crítica"
                    : "No se detectaron actividades en la ruta crítica"}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {criticalList.map(a => (
                    <li key={a.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="text-xs text-slate-300 truncate">{a.name}</span>
                      {a.member_name && (
                        <span className="ml-auto text-[10px] text-slate-600 shrink-0 flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {a.member_name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal */}
      <ActivityModal
        open={modalOpen}
        editId={editId}
        initial={editData}
        members={memberOptions}
        activities={activityOptions}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveActivity}
        onRequestElementSelection={requestElementSelection}
      />
    </div>
  );
}

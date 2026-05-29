"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast }     from "@/components/ui/toast";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  Loader2, CheckCircle2, Clock, AlertCircle,
  Circle, Plus, ChevronDown, ChevronUp,
} from "lucide-react";

type ElementRow = {
  id: string; name: string; element_type: string; ifc_guid: string;
  element_progress: { progress_percentage: number; status: string; notes: string; updated_at: string }[];
};

const STATUS_OPTIONS = [
  { value: "pendiente",   label: "Pendiente",   icon: Circle,       color: "text-slate-400" },
  { value: "en_progreso", label: "En progreso", icon: Clock,        color: "text-yellow-400" },
  { value: "completado",  label: "Completado",  icon: CheckCircle2, color: "text-green-400"  },
  { value: "bloqueado",   label: "Bloqueado",   icon: AlertCircle,  color: "text-red-400"    },
] as const;

const PCT_COLOR = (pct: number) =>
  pct >= 100 ? "from-green-400 to-green-500"
  : pct >= 50 ? "from-brand-300 to-cyan-400"
  : "from-brand-400 to-brand-300";

interface Props { projectId: string; elements: ElementRow[] }

export function ProgressClient({ projectId, elements }: Props) {
  const router              = useRouter();
  const toast               = useToast();
  const [editing, setEdit]  = useState<string | null>(null);
  const [saving, setSave]   = useState(false);
  const [addOpen, setAdd]   = useState(false);
  const [newEl, setNewEl]   = useState({ name: "", element_type: "" });
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ progress: 0, status: "pendiente", notes: "" });
  const [collapsed, setCol] = useState<Set<string>>(new Set());

  function toggleGroup(type: string) {
    setCol(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  function openEdit(el: ElementRow) {
    const p = el.element_progress?.[0];
    setForm({ progress: p?.progress_percentage ?? 0, status: p?.status ?? "pendiente", notes: p?.notes ?? "" });
    setEdit(el.id);
  }

  async function saveProgress(elementId: string) {
    setSave(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from("element_progress").select("id").eq("element_id", elementId).single();

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("element_progress").update({
          progress_percentage: form.progress,
          status:  form.status,
          notes:   form.notes,
          updated_at: new Date().toISOString(),
        }).eq("element_id", elementId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("element_progress").insert({
          element_id:  elementId,
          project_id:  projectId,
          progress_percentage: form.progress,
          status:  form.status,
          notes:   form.notes,
        });
      }
      toast.success("Progreso actualizado");
      setEdit(null);
      router.refresh();
    } catch {
      toast.error("Error al guardar progreso");
    } finally {
      setSave(false);
    }
  }

  async function addElement() {
    if (!newEl.name) return;
    setAdding(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("model_elements").insert({
        project_id:   projectId,
        name:         newEl.name,
        element_type: newEl.element_type || "General",
        ifc_guid:     `manual-${Date.now()}`,
      });
      toast.success("Elemento agregado", { description: newEl.name });
      setAdd(false);
      setNewEl({ name: "", element_type: "" });
      router.refresh();
    } catch {
      toast.error("Error al agregar elemento");
    } finally {
      setAdding(false);
    }
  }

  const grouped = elements.reduce<Record<string, ElementRow[]>>((acc, el) => {
    const t = el.element_type || "Sin tipo";
    (acc[t] ??= []).push(el);
    return acc;
  }, {});

  const totalElements   = elements.length;
  const completedCount  = elements.filter(e => e.element_progress?.[0]?.progress_percentage >= 100).length;
  const overallProgress = totalElements === 0 ? 0
    : Math.round(elements.reduce((a, e) => a + (e.element_progress?.[0]?.progress_percentage ?? 0), 0) / totalElements);

  return (
    <div className="space-y-4">
      {/* Resumen global */}
      {totalElements > 0 && (
        <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400">Progreso global del proyecto</span>
              <span className="text-sm font-bold text-slate-100 font-mono">{overallProgress}%</span>
            </div>
            <div className="w-full bg-surface-border rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r transition-all duration-500 ${PCT_COLOR(overallProgress)}`}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
            <span><span className="text-slate-200 font-semibold">{completedCount}</span> / {totalElements} completados</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={() => setAdd(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Agregar elemento
        </button>
      </div>

      {/* Modal agregar elemento */}
      <Modal open={addOpen} onClose={() => setAdd(false)} title="Nuevo elemento">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input-field"
              placeholder="Ej: Columna A-01"
              value={newEl.name}
              onChange={e => setNewEl(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <input
              className="input-field"
              placeholder="Ej: Columna, Viga, Muro..."
              value={newEl.element_type}
              onChange={e => setNewEl(p => ({ ...p, element_type: e.target.value }))}
            />
          </div>
        </div>
        <ModalFooter>
          <button onClick={() => setAdd(false)} className="btn-secondary">Cancelar</button>
          <button onClick={addElement} disabled={adding || !newEl.name} className="btn-primary">
            {adding && <Loader2 className="w-4 h-4 animate-spin" />} Agregar
          </button>
        </ModalFooter>
      </Modal>

      {/* Estado vacío */}
      {elements.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <CheckCircle2 className="w-5 h-5 text-slate-500" />
            </div>
            <p className="empty-state-title">Sin elementos registrados</p>
            <p className="empty-state-desc">
              Agrega elementos manualmente o carga un modelo IFC desde el detalle del proyecto.
            </p>
            <button onClick={() => setAdd(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Agregar elemento
            </button>
          </div>
        </div>
      )}

      {/* Grupos */}
      {Object.entries(grouped).map(([type, els]) => {
        const avg      = Math.round(els.reduce((a, e) => a + (e.element_progress?.[0]?.progress_percentage ?? 0), 0) / els.length);
        const isCollapsed = collapsed.has(type);

        return (
          <div key={type} className="glass-card overflow-hidden">
            {/* Header del grupo */}
            <button
              onClick={() => toggleGroup(type)}
              className="w-full px-4 py-3 border-b border-surface-border flex items-center gap-3 hover:bg-surface-hover/50 transition-colors text-left"
            >
              {isCollapsed
                ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                : <ChevronUp   className="w-4 h-4 text-slate-500 shrink-0" />}
              <span className="text-sm font-semibold text-slate-100 flex-1">{type}</span>
              <span className="text-xs text-slate-500">{els.length} elem.</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 bg-surface-border rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${PCT_COLOR(avg)}`}
                    style={{ width: `${avg}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300 w-8 text-right font-mono">{avg}%</span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-surface-border">
                {els.map(el => {
                  const prog   = el.element_progress?.[0];
                  const pct    = prog?.progress_percentage ?? 0;
                  const st     = prog?.status ?? "pendiente";
                  const stOpt  = STATUS_OPTIONS.find(s => s.value === st) ?? STATUS_OPTIONS[0];
                  const StatusIcon = stOpt.icon;

                  return (
                    <div key={el.id} className="px-4 py-3 hover:bg-surface-hover/40 transition-colors">
                      {editing === el.id ? (
                        /* Formulario inline de edición */
                        <div className="space-y-3 animate-slide-up">
                          <p className="text-sm font-medium text-slate-200">{el.name}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="label">Progreso: <span className="text-brand-200 font-mono">{form.progress}%</span></label>
                              <input
                                type="range" min={0} max={100} value={form.progress}
                                onChange={e => setForm(p => ({ ...p, progress: +e.target.value }))}
                                className="w-full accent-brand-300 mt-1"
                              />
                            </div>
                            <div>
                              <label className="label">Estado</label>
                              <select
                                className="input-field text-sm mt-1"
                                value={form.status}
                                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                              >
                                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="label">Notas</label>
                            <textarea
                              className="input-field text-sm resize-none mt-1" rows={2}
                              value={form.notes}
                              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                              placeholder="Observaciones..."
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEdit(null)} className="btn-ghost text-xs px-3 py-1.5">
                              Cancelar
                            </button>
                            <button onClick={() => saveProgress(el.id)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vista normal — clickeable para editar */
                        <button
                          className="w-full flex items-center gap-3 text-left group"
                          onClick={() => openEdit(el)}
                        >
                          <StatusIcon className={`w-4 h-4 shrink-0 ${stOpt.color}`} />
                          <span className="text-sm text-slate-300 flex-1 min-w-0 truncate group-hover:text-slate-100 transition-colors">
                            {el.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Barra de progreso — oculta en mobile muy pequeño */}
                            <div className="hidden sm:block w-20 bg-surface-border rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${PCT_COLOR(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-mono w-8 text-right">{pct}%</span>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ChevronDown, CheckCircle2, Clock, AlertCircle, Circle, Plus, X } from "lucide-react";

type ElementRow = {
  id: string; name: string; element_type: string; ifc_guid: string;
  element_progress: { progress_percentage: number; status: string; notes: string; updated_at: string }[];
};

const STATUS_OPTIONS = [
  { value: "pendiente",    label: "Pendiente",    icon: Circle,       color: "text-slate-400" },
  { value: "en_progreso",  label: "En progreso",  icon: Clock,        color: "text-yellow-400" },
  { value: "completado",   label: "Completado",   icon: CheckCircle2, color: "text-green-400" },
  { value: "bloqueado",    label: "Bloqueado",    icon: AlertCircle,  color: "text-red-400" },
];

interface Props { projectId: string; elements: ElementRow[] }

export function ProgressClient({ projectId, elements }: Props) {
  const router             = useRouter();
  const [editing, setEdit] = useState<string | null>(null);
  const [saving, setSave]  = useState(false);
  const [form, setForm]    = useState({ progress: 0, status: "pendiente", notes: "" });
  const [addOpen, setAdd]  = useState(false);
  const [newEl, setNewEl]  = useState({ name: "", element_type: "", ifc_guid: "" });
  const [adding, setAdding]= useState(false);

  function openEdit(el: ElementRow) {
    const p = el.element_progress?.[0];
    setForm({ progress: p?.progress_percentage ?? 0, status: p?.status ?? "pendiente", notes: p?.notes ?? "" });
    setEdit(el.id);
  }

  async function saveProgress(elementId: string) {
    setSave(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("element_progress")
      .select("id")
      .eq("element_id", elementId)
      .single();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("element_progress").update({
        progress_percentage: form.progress,
        status: form.status,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      }).eq("element_id", elementId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("element_progress").insert({
        element_id: elementId,
        project_id: projectId,
        progress_percentage: form.progress,
        status: form.status,
        notes: form.notes,
      });
    }

    setSave(false); setEdit(null); router.refresh();
  }

  async function addElement() {
    if (!newEl.name) return;
    setAdding(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("model_elements").insert({
      project_id:   projectId,
      name:         newEl.name,
      element_type: newEl.element_type || "General",
      ifc_guid:     newEl.ifc_guid || `manual-${Date.now()}`,
    });
    setAdding(false); setAdd(false); setNewEl({ name: "", element_type: "", ifc_guid: "" }); router.refresh();
  }

  const grouped = elements.reduce<Record<string, ElementRow[]>>((acc, el) => {
    const t = el.element_type || "Sin tipo";
    if (!acc[t]) acc[t] = [];
    acc[t].push(el);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Botón agregar elemento */}
      <div className="flex justify-end">
        <button onClick={() => setAdd(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Agregar elemento
        </button>
      </div>

      {/* Modal agregar */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Nuevo elemento</h3>
              <button onClick={() => setAdd(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input className="input-field" placeholder="Ej: Columna A-01" value={newEl.name}
                onChange={e => setNewEl(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <input className="input-field" placeholder="Ej: Columna, Viga, Muro..." value={newEl.element_type}
                onChange={e => setNewEl(p => ({ ...p, element_type: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAdd(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={addElement} disabled={adding || !newEl.name} className="btn-primary flex-1 justify-center">
                {adding && <Loader2 className="w-4 h-4 animate-spin" />} Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sin elementos */}
      {elements.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 text-sm">No hay elementos registrados aún.</p>
          <p className="text-slate-500 text-xs mt-1">Agrega elementos manualmente o carga un modelo IFC desde el detalle del proyecto.</p>
        </div>
      )}

      {/* Elementos agrupados por tipo */}
      {Object.entries(grouped).map(([type, els]) => {
        const avg = Math.round(els.reduce((a, e) => a + (e.element_progress?.[0]?.progress_percentage ?? 0), 0) / els.length);
        return (
          <div key={type} className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-100">{type}</span>
                <span className="text-xs text-slate-500">{els.length} elementos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-surface-border rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-brand-300 to-cyan-400" style={{ width: `${avg}%` }} />
                </div>
                <span className="text-xs font-medium text-brand-200 w-8 text-right">{avg}%</span>
              </div>
            </div>

            <div className="divide-y divide-surface-border">
              {els.map(el => {
                const prog = el.element_progress?.[0];
                const pct  = prog?.progress_percentage ?? 0;
                const st   = prog?.status ?? "pendiente";
                const StatusIcon = STATUS_OPTIONS.find(s => s.value === st)?.icon ?? Circle;
                const statusColor = STATUS_OPTIONS.find(s => s.value === st)?.color ?? "text-slate-400";

                return (
                  <div key={el.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                    {editing === el.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-slate-200">{el.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">Progreso: {form.progress}%</label>
                            <input type="range" min={0} max={100} value={form.progress}
                              onChange={e => setForm(p => ({ ...p, progress: +e.target.value }))}
                              className="w-full accent-brand-300" />
                          </div>
                          <div>
                            <label className="label text-xs">Estado</label>
                            <select className="input-field text-sm" value={form.status}
                              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="label text-xs">Notas</label>
                          <textarea className="input-field text-sm resize-none" rows={2} value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones..." />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEdit(null)} className="btn-ghost text-xs px-3 py-1.5">Cancelar</button>
                          <button onClick={() => saveProgress(el.id)} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => openEdit(el)}>
                        <StatusIcon className={`w-4 h-4 shrink-0 ${statusColor}`} />
                        <span className="text-sm text-slate-300 flex-1 min-w-0 truncate">{el.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20 bg-surface-border rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-brand-300/70" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

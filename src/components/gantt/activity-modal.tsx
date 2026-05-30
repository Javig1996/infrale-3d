"use client";

import { useState, useEffect } from "react";
import { X, Calendar, User, Box, Link2, Target, ChevronDown } from "lucide-react";

export interface ActivityFormData {
  name:         string;
  start_date:   string;
  end_date:     string;
  element_name: string;
  member_id:    string;
  predecessors: string[];
  parent_id:    string;
}

export interface MemberOption   { id: string; name: string; role: string | null; }
export interface ActivityOption { id: string; name: string; parent_id: string | null; }

interface Props {
  open:      boolean;
  editId:    string | null;
  initial?:  Partial<ActivityFormData>;
  members:   MemberOption[];
  activities: ActivityOption[];
  onClose:   () => void;
  onSave:    (data: ActivityFormData, id?: string) => Promise<void>;
  onRequestElementSelection: (cb: (name: string) => void) => void;
}

const EMPTY: ActivityFormData = {
  name: "", start_date: "", end_date: "",
  element_name: "", member_id: "", predecessors: [], parent_id: "",
};

export function ActivityModal({
  open, editId, initial, members, activities,
  onClose, onSave, onRequestElementSelection,
}: Props) {
  const [form, setForm]       = useState<ActivityFormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [predOpen, setPredOpen] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
    setPredOpen(false);
  }, [open, initial]);

  function set<K extends keyof ActivityFormData>(k: K, v: ActivityFormData[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function togglePred(id: string) {
    set("predecessors", form.predecessors.includes(id)
      ? form.predecessors.filter(p => p !== id)
      : [...form.predecessors, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date) return;
    setLoading(true);
    try {
      await onSave(form, editId ?? undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleSelectElement() {
    onRequestElementSelection(name => set("element_name", name));
  }

  if (!open) return null;

  const availablePreds   = activities.filter(a => a.id !== editId);
  const availableParents = activities.filter(a => a.id !== editId && !a.parent_id);
  const durationDays = form.start_date && form.end_date
    ? Math.max(0, Math.round(
        (new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86_400_000
      ))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg glass-card p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100">
            {editId ? "Editar actividad" : "Nueva actividad"}
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nombre de la actividad *
            </label>
            <input
              className="input-field"
              placeholder="Ej: Excavación masiva"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              required
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Inicio *
              </label>
              <input
                type="date"
                className="input-field"
                value={form.start_date}
                onChange={e => set("start_date", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fin *
              </label>
              <input
                type="date"
                className="input-field"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={e => set("end_date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duración calculada */}
          {durationDays !== null && (
            <p className="text-xs text-slate-500 -mt-2">
              Duración: <span className="text-slate-300 font-medium">{durationDays} días</span>
            </p>
          )}

          {/* Elemento 3D */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Box className="w-3 h-3" /> Elemento 3D asociado
            </label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="Sin elemento seleccionado"
                value={form.element_name}
                onChange={e => set("element_name", e.target.value)}
              />
              <button
                type="button"
                onClick={handleSelectElement}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-brand-300 border border-brand-300/30 hover:bg-brand-300/10 transition-colors shrink-0"
              >
                <Target className="w-3.5 h-3.5" />
                Seleccionar
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Haz clic en &quot;Seleccionar&quot; y luego en el elemento en el visor 3D
            </p>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" /> Responsable
            </label>
            <select
              className="input-field"
              value={form.member_id}
              onChange={e => set("member_id", e.target.value)}
            >
              <option value="">Sin asignar</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.role ? ` — ${m.role}` : ""}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="text-[11px] text-slate-600 mt-1">
                Agrega miembros en la pestaña &quot;Asignación de equipo&quot;
              </p>
            )}
          </div>

          {/* Predecesoras */}
          {availablePreds.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Actividades predecesoras
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPredOpen(v => !v)}
                  className="input-field w-full text-left flex items-center justify-between"
                >
                  <span className={form.predecessors.length ? "text-slate-300" : "text-slate-500"}>
                    {form.predecessors.length
                      ? `${form.predecessors.length} seleccionada(s)`
                      : "Ninguna"}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${predOpen ? "rotate-180" : ""}`} />
                </button>
                {predOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card py-1 z-20 max-h-36 overflow-y-auto">
                    {availablePreds.map(a => (
                      <label
                        key={a.id}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-surface-hover cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.predecessors.includes(a.id)}
                          onChange={() => togglePred(a.id)}
                          className="accent-cyan-400"
                        />
                        <span className="text-xs text-slate-300 truncate">{a.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actividad padre */}
          {availableParents.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Agrupar bajo (actividad padre)
              </label>
              <select
                className="input-field"
                value={form.parent_id}
                onChange={e => set("parent_id", e.target.value)}
              >
                <option value="">Sin grupo (actividad raíz)</option>
                {availableParents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "Guardando…" : editId ? "Actualizar" : "Agregar actividad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

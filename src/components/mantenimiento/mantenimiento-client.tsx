"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate }   from "@/lib/utils";
import {
  Plus, X, Loader2, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, Trash2, Send
} from "lucide-react";

type MaintRecord = {
  id: string; title: string; description: string; type: string; status: string; priority: string;
  scheduled_date: string; completed_date: string | null; next_maintenance_date: string | null;
  alert_email: string | null; created_at: string;
  model_elements: { id: string; name: string; element_type: string } | null;
};
type ElementBasic = { id: string; name: string; element_type: string };

const TYPES     = ["preventivo", "correctivo", "predictivo", "inspeccion"];
const PRIORITIES= ["baja", "media", "alta", "critica"];
const STATUS_MAP= {
  pendiente:   { label: "Pendiente",   icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  en_proceso:  { label: "En proceso",  icon: Loader2,      color: "text-brand-200",  bg: "bg-brand-200/10 border-brand-200/20" },
  completado:  { label: "Completado",  icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20" },
  cancelado:   { label: "Cancelado",   icon: X,            color: "text-slate-500",  bg: "bg-slate-500/10 border-slate-500/20" },
};
const PRIO_MAP  = {
  baja:    "text-slate-400", media: "text-yellow-400",
  alta:    "text-orange-400", critica: "text-red-400",
};

const EMPTY_FORM = {
  title: "", description: "", type: "preventivo", priority: "media",
  element_id: "", scheduled_date: "", next_maintenance_date: "", alert_email: "",
};

interface Props { projectId: string; records: MaintRecord[]; elements: ElementBasic[] }

export function MantenimientoClient({ projectId, records, elements }: Props) {
  const router              = useRouter();
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSend]  = useState<string | null>(null);
  const [filter, setFilter] = useState("todos");
  const [form, setForm]     = useState(EMPTY_FORM);

  const filtered = filter === "todos"
    ? records
    : records.filter(r => r.status === filter);

  async function save() {
    if (!form.title || !form.scheduled_date) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("maintenance_records").insert({
      project_id:            projectId,
      element_id:            form.element_id || null,
      title:                 form.title,
      description:           form.description || null,
      type:                  form.type,
      priority:              form.priority,
      status:                "pendiente",
      scheduled_date:        form.scheduled_date,
      next_maintenance_date: form.next_maintenance_date || null,
      alert_email:           form.alert_email || null,
      created_by:            user.id,
    });

    setSaving(false); setModal(false); setForm(EMPTY_FORM); router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("maintenance_records").update({
      status,
      completed_date: status === "completado" ? new Date().toISOString() : null,
    }).eq("id", id);
    router.refresh();
  }

  async function deleteRecord(id: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("maintenance_records").delete().eq("id", id);
    router.refresh();
  }

  async function sendAlert(record: MaintRecord) {
    if (!record.alert_email) return;
    setSend(record.id);
    await fetch("/api/mantenimiento/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId: record.id }),
    });
    setSend(null);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {["todos", "pendiente", "en_proceso", "completado"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-brand-300/20 text-brand-200 border border-brand-300/30" : "btn-ghost"
              }`}>
              {f === "todos" ? "Todos" : STATUS_MAP[f as keyof typeof STATUS_MAP]?.label ?? f}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm ml-auto">
          <Plus className="w-4 h-4" /> Nuevo registro
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Nuevo registro de mantenimiento</h3>
              <button onClick={() => setModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="label">Título *</label>
              <input className="input-field" placeholder="Ej: Revisión bomba hidráulica"
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo</label>
                <select className="input-field" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prioridad</label>
                <select className="input-field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Elemento asociado</label>
              <select className="input-field" value={form.element_id} onChange={e => setForm(p => ({ ...p, element_id: e.target.value }))}>
                <option value="">Sin elemento específico</option>
                {elements.map(el => <option key={el.id} value={el.id}>{el.name} ({el.element_type})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fecha programada *</label>
                <input type="date" className="input-field" value={form.scheduled_date}
                  onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Próximo mantenimiento</label>
                <input type="date" className="input-field" value={form.next_maintenance_date}
                  onChange={e => setForm(p => ({ ...p, next_maintenance_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label">Email para alertas</label>
              <input type="email" className="input-field" placeholder="responsable@empresa.com"
                value={form.alert_email} onChange={e => setForm(p => ({ ...p, alert_email: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Recibirá alertas automáticas antes del vencimiento</p>
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Detalles del mantenimiento..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={save} disabled={saving || !form.title || !form.scheduled_date} className="btn-primary flex-1 justify-center">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 text-sm">No hay registros de mantenimiento.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(record => {
          const st      = STATUS_MAP[record.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pendiente;
          const Icon    = st.icon;
          const isOver  = record.status === "pendiente" && new Date(record.scheduled_date) < new Date();
          const prioClr = PRIO_MAP[record.priority as keyof typeof PRIO_MAP] ?? "text-slate-400";

          return (
            <div key={record.id} className={`glass-card p-4 ${isOver ? "border-red-500/30" : ""}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-200">{record.title}</p>
                    {isOver && <span className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle className="w-3 h-3" />Vencido</span>}
                    <span className={`text-xs font-medium ${prioClr}`}>{record.priority}</span>
                    <span className="text-xs text-slate-500">{record.type}</span>
                  </div>

                  {record.model_elements && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Elemento: <span className="text-slate-400">{record.model_elements.name}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span>Programado: <span className="text-slate-400">{formatDate(record.scheduled_date)}</span></span>
                    {record.next_maintenance_date && (
                      <span>Próximo: <span className="text-slate-400">{formatDate(record.next_maintenance_date)}</span></span>
                    )}
                  </div>

                  {record.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{record.description}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 shrink-0">
                  {record.alert_email && record.status === "pendiente" && (
                    <button onClick={() => sendAlert(record)} disabled={sending === record.id}
                      className="btn-ghost p-1.5 text-cyan-400" title="Enviar alerta por email">
                      {sending === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <div className="relative group">
                    <button className="btn-ghost p-1.5"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <div className="absolute right-0 top-full mt-1 w-36 glass-card py-1 z-10 hidden group-hover:block">
                      {["pendiente", "en_proceso", "completado", "cancelado"].map(s => (
                        <button key={s} onClick={() => updateStatus(record.id, s)}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-surface-hover transition-colors">
                          {STATUS_MAP[s as keyof typeof STATUS_MAP]?.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => deleteRecord(record.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

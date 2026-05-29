"use client";

import { useState }     from "react";
import { useRouter }    from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDate }   from "@/lib/utils";
import { useToast }     from "@/components/ui/toast";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  Plus, Loader2, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, Trash2, Send, X,
} from "lucide-react";

type MaintRecord = {
  id: string; title: string; description: string; type: string; status: string; priority: string;
  scheduled_date: string; completed_date: string | null; next_maintenance_date: string | null;
  alert_email: string | null; created_at: string;
  model_elements: { id: string; name: string; element_type: string } | null;
};
type ElementBasic = { id: string; name: string; element_type: string };

const TYPES      = ["preventivo", "correctivo", "predictivo", "inspeccion"];
const PRIORITIES = ["baja", "media", "alta", "critica"];
const STATUS_MAP = {
  pendiente:  { label: "Pendiente",  icon: Clock,        color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  en_proceso: { label: "En proceso", icon: Loader2,      color: "text-brand-200",  bg: "bg-brand-200/10 border-brand-200/20" },
  completado: { label: "Completado", icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20" },
  cancelado:  { label: "Cancelado",  icon: X,            color: "text-slate-500",  bg: "bg-slate-500/10 border-slate-500/20" },
};
const PRIO_MAP = {
  baja: "chip-default", media: "chip-warning", alta: "chip-danger text-orange-400 border-orange-500/20 bg-orange-500/10", critica: "chip-danger",
};
const FILTER_TABS = ["todos", "pendiente", "en_proceso", "completado"] as const;

const EMPTY_FORM = {
  title: "", description: "", type: "preventivo", priority: "media",
  element_id: "", scheduled_date: "", next_maintenance_date: "", alert_email: "",
};

interface Props { projectId: string; records: MaintRecord[]; elements: ElementBasic[] }

export function MantenimientoClient({ projectId, records, elements }: Props) {
  const router                = useRouter();
  const toast                 = useToast();
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [sending, setSend]    = useState<string | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);
  const [filter, setFilter]   = useState<typeof FILTER_TABS[number]>("todos");
  const [form, setForm]       = useState(EMPTY_FORM);
  const [openMenu, setMenu]   = useState<string | null>(null);

  const filtered = filter === "todos" ? records : records.filter(r => r.status === filter);

  function field<K extends keyof typeof EMPTY_FORM>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!form.title || !form.scheduled_date) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("maintenance_records").insert({
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
      if (error) throw error;
      toast.success("Registro creado", { description: `"${form.title}" agregado correctamente.` });
      setModal(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch {
      toast.error("Error al guardar", { description: "Verifica los datos e intenta nuevamente." });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("maintenance_records").update({
      status,
      completed_date: status === "completado" ? new Date().toISOString() : null,
    }).eq("id", id);
    setMenu(null);
    toast.success("Estado actualizado");
    router.refresh();
  }

  async function deleteRecord(id: string, title: string) {
    setDel(id);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("maintenance_records").delete().eq("id", id);
      toast.success("Registro eliminado", { description: `"${title}" fue eliminado.` });
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDel(null);
    }
  }

  async function sendAlert(record: MaintRecord) {
    if (!record.alert_email) return;
    setSend(record.id);
    try {
      const res = await fetch("/api/mantenimiento/alert", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ recordId: record.id }),
      });
      if (res.ok) toast.success("Alerta enviada", { description: `Email enviado a ${record.alert_email}` });
      else        toast.error("Error al enviar alerta");
    } catch {
      toast.error("Error al enviar alerta");
    } finally {
      setSend(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filtros como chips scrollables en mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-brand-300/20 text-brand-200 border border-brand-300/30"
                  : "btn-ghost"
              }`}
            >
              {f === "todos" ? "Todos" : STATUS_MAP[f as keyof typeof STATUS_MAP]?.label ?? f}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-sm sm:ml-auto shrink-0">
          <Plus className="w-4 h-4" />
          <span>Nuevo registro</span>
        </button>
      </div>

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nuevo registro de mantenimiento"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input
              className="input-field"
              placeholder="Ej: Revisión bomba hidráulica"
              value={form.title}
              onChange={e => field("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select className="input-field" value={form.type} onChange={e => field("type", e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="input-field" value={form.priority} onChange={e => field("priority", e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {elements.length > 0 && (
            <div>
              <label className="label">Elemento asociado</label>
              <select className="input-field" value={form.element_id} onChange={e => field("element_id", e.target.value)}>
                <option value="">Sin elemento específico</option>
                {elements.map(el => <option key={el.id} value={el.id}>{el.name} ({el.element_type})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha programada *</label>
              <input type="date" className="input-field" value={form.scheduled_date}
                onChange={e => field("scheduled_date", e.target.value)} />
            </div>
            <div>
              <label className="label">Próximo mantenimiento</label>
              <input type="date" className="input-field" value={form.next_maintenance_date}
                onChange={e => field("next_maintenance_date", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Email para alertas</label>
            <input
              type="email" className="input-field"
              placeholder="responsable@empresa.com"
              value={form.alert_email}
              onChange={e => field("alert_email", e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">Recibirá alertas automáticas antes del vencimiento</p>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              className="input-field resize-none" rows={3}
              placeholder="Detalles del mantenimiento..."
              value={form.description}
              onChange={e => field("description", e.target.value)}
            />
          </div>
        </div>

        <ModalFooter>
          <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
          <button
            onClick={save}
            disabled={saving || !form.title || !form.scheduled_date}
            className="btn-primary"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </ModalFooter>
      </Modal>

      {/* Estado vacío */}
      {filtered.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <AlertTriangle className="w-5 h-5 text-slate-500" />
            </div>
            <p className="empty-state-title">
              {filter === "todos" ? "Sin registros de mantenimiento" : `Sin registros "${STATUS_MAP[filter as keyof typeof STATUS_MAP]?.label ?? filter}"`}
            </p>
            <p className="empty-state-desc">
              Crea el primer registro para llevar control del mantenimiento de tus infraestructuras.
            </p>
            {filter === "todos" && (
              <button onClick={() => setModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Nuevo registro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de registros */}
      <div className="space-y-2">
        {filtered.map(record => {
          const st      = STATUS_MAP[record.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pendiente;
          const Icon    = st.icon;
          const isOver  = record.status === "pendiente" && new Date(record.scheduled_date) < new Date();
          const prioClass = PRIO_MAP[record.priority as keyof typeof PRIO_MAP] ?? "chip-default";

          return (
            <div
              key={record.id}
              className={`glass-card p-4 transition-colors ${isOver ? "border-red-500/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${st.bg}`}>
                  <Icon className={`w-4 h-4 ${st.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Título + badges en mobile: apilados */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <p className="text-sm font-semibold text-slate-200 leading-tight">{record.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {isOver && (
                        <span className="chip-danger flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Vencido
                        </span>
                      )}
                      <span className={`chip ${prioClass}`}>{record.priority}</span>
                      <span className="chip-default">{record.type}</span>
                    </div>
                  </div>

                  {record.model_elements && (
                    <p className="text-xs text-slate-500 mt-1">
                      Elemento: <span className="text-slate-400">{record.model_elements.name}</span>
                    </p>
                  )}

                  {/* Fechas — stack en mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 mt-1.5 text-xs text-slate-500">
                    <span>Programado: <span className="text-slate-400">{formatDate(record.scheduled_date)}</span></span>
                    {record.next_maintenance_date && (
                      <span>Próximo: <span className="text-slate-400">{formatDate(record.next_maintenance_date)}</span></span>
                    )}
                  </div>

                  {record.description && (
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{record.description}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {record.alert_email && record.status === "pendiente" && (
                    <button
                      onClick={() => sendAlert(record)}
                      disabled={sending === record.id}
                      className="btn-icon"
                      title={`Enviar alerta a ${record.alert_email}`}
                    >
                      {sending === record.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        : <Send className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  )}

                  {/* Dropdown estado */}
                  <div className="relative">
                    <button
                      className="btn-icon"
                      onClick={() => setMenu(openMenu === record.id ? null : record.id)}
                      title="Cambiar estado"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${openMenu === record.id ? "rotate-180" : ""}`} />
                    </button>
                    {openMenu === record.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} aria-hidden="true" />
                        <div className="absolute right-0 top-full mt-1 w-40 glass-card py-1 z-20 animate-scale-in">
                          {(["pendiente", "en_proceso", "completado", "cancelado"] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(record.id, s)}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                record.status === s
                                  ? "text-brand-200 bg-brand-300/10"
                                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
                              }`}
                            >
                              {STATUS_MAP[s].label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => deleteRecord(record.id, record.title)}
                    disabled={deleting === record.id}
                    className="btn-icon text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Eliminar registro"
                  >
                    {deleting === record.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
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

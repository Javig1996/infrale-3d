"use client";

import { useState, useRef } from "react";
import { useRouter }        from "next/navigation";
import { createClient }     from "@/lib/supabase/client";
import {
  ChevronDown, ChevronRight, FileText, Upload, Download,
  Loader2, Plus, X, Save, Trash2
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type TechInfo = {
  id: string; manufacturer: string; model: string; serial_number: string;
  installation_date: string; warranty_expiry: string; specifications: Record<string, string>; notes: string;
};
type DocRow = { id: string; name: string; file_url: string; file_size: number; document_type: string; created_at: string };
type ElementRow = {
  id: string; name: string; element_type: string; ifc_guid: string; properties: Record<string, unknown>;
  element_technical_info: TechInfo[];
  element_documents: DocRow[];
};

const DOC_TYPES = ["plano", "manual", "certificado", "foto", "informe", "otro"];

interface Props { projectId: string; elements: ElementRow[] }

export function OperacionClient({ projectId, elements }: Props) {
  const router              = useRouter();
  const [expanded, setExp]  = useState<string | null>(null);
  const [savingTech, setST] = useState(false);
  const [uploadingDoc, setUD]= useState(false);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const [techForms, setTF]  = useState<Record<string, Partial<TechInfo>>>({});
  const [docType, setDT]    = useState("otro");
  const [addEl, setAddEl]   = useState(false);
  const [newEl, setNewEl]   = useState({ name: "", element_type: "" });
  const [addingEl, setAE]   = useState(false);

  function getForm(el: ElementRow): Partial<TechInfo> {
    if (techForms[el.id]) return techForms[el.id];
    const t = el.element_technical_info?.[0];
    return t ? { ...t } : {};
  }

  function setField(elId: string, key: keyof TechInfo, val: string) {
    setTF(prev => ({ ...prev, [elId]: { ...getFormById(elId), [key]: val } }));
  }

  function getFormById(elId: string) {
    const el = elements.find(e => e.id === elId);
    return el ? getForm(el) : {};
  }

  async function saveTech(el: ElementRow) {
    setST(true);
    const supabase = createClient();
    const form     = getForm(el);
    const existing = el.element_technical_info?.[0];

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("element_technical_info").update({
        manufacturer:      form.manufacturer || null,
        model:             form.model || null,
        serial_number:     form.serial_number || null,
        installation_date: form.installation_date || null,
        warranty_expiry:   form.warranty_expiry || null,
        notes:             form.notes || null,
      }).eq("id", existing.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("element_technical_info").insert({
        element_id:        el.id,
        project_id:        projectId,
        manufacturer:      form.manufacturer || null,
        model:             form.model || null,
        serial_number:     form.serial_number || null,
        installation_date: form.installation_date || null,
        warranty_expiry:   form.warranty_expiry || null,
        notes:             form.notes || null,
      });
    }
    setST(false); router.refresh();
  }

  async function uploadDoc(el: ElementRow, file: File) {
    setUD(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUD(false); return; }

    const form = new FormData();
    form.append("file",       file);
    form.append("element_id", el.id);
    form.append("project_id", projectId);
    form.append("user_id",    user.id);
    form.append("doc_type",   docType);

    await fetch("/api/documentos/upload", { method: "POST", body: form });
    setUD(false); router.refresh();
  }

  async function deleteDoc(docId: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("element_documents").delete().eq("id", docId);
    router.refresh();
  }

  async function addElement() {
    if (!newEl.name) return;
    setAE(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("model_elements").insert({
      project_id:   projectId,
      name:         newEl.name,
      element_type: newEl.element_type || "General",
      ifc_guid:     `manual-${Date.now()}`,
    });
    setAE(false); setAddEl(false); setNewEl({ name: "", element_type: "" }); router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setAddEl(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Agregar elemento
        </button>
      </div>

      {addEl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/80 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Nuevo elemento</h3>
              <button onClick={() => setAddEl(false)} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input className="input-field" placeholder="Ej: Bomba centrífuga B-01" value={newEl.name}
                onChange={e => setNewEl(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <input className="input-field" placeholder="Ej: Bomba, Compresor, Panel..." value={newEl.element_type}
                onChange={e => setNewEl(p => ({ ...p, element_type: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAddEl(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={addElement} disabled={addingEl || !newEl.name} className="btn-primary flex-1 justify-center">
                {addingEl && <Loader2 className="w-4 h-4 animate-spin" />} Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {elements.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 text-sm">No hay elementos registrados.</p>
        </div>
      )}

      {elements.map(el => {
        const isOpen = expanded === el.id;
        const form   = getForm(el);
        const docs   = el.element_documents ?? [];

        return (
          <div key={el.id} className="glass-card overflow-hidden">
            <button
              onClick={() => setExp(isOpen ? null : el.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{el.name}</p>
                <p className="text-xs text-slate-500">{el.element_type}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                {docs.length > 0 && <span>{docs.length} doc{docs.length > 1 ? "s" : ""}</span>}
                {el.element_technical_info?.[0] && <span className="text-green-400">Ficha ✓</span>}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-surface-border p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ficha técnica */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ficha técnica</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "manufacturer",      label: "Fabricante",   type: "text" },
                      { key: "model",             label: "Modelo",       type: "text" },
                      { key: "serial_number",     label: "N° Serie",     type: "text" },
                      { key: "installation_date", label: "Instalación",  type: "date" },
                      { key: "warranty_expiry",   label: "Garantía hasta",type: "date" },
                    ].map(f => (
                      <div key={f.key} className={f.key === "serial_number" ? "col-span-2" : ""}>
                        <label className="label text-xs">{f.label}</label>
                        <input type={f.type} className="input-field text-sm"
                          value={(form as Record<string, string>)[f.key] ?? ""}
                          onChange={e => setField(el.id, f.key as keyof TechInfo, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="label text-xs">Notas</label>
                    <textarea className="input-field text-sm resize-none" rows={2}
                      value={form.notes ?? ""}
                      onChange={e => setField(el.id, "notes", e.target.value)} />
                  </div>
                  <button onClick={() => saveTech(el)} disabled={savingTech} className="btn-primary text-xs w-full justify-center">
                    {savingTech ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar ficha
                  </button>
                </div>

                {/* Documentos */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documentos adjuntos</h4>

                  {/* Upload */}
                  <div className="flex gap-2">
                    <select className="input-field text-sm flex-1" value={docType} onChange={e => setDT(e.target.value)}>
                      {DOC_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(el, f); }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingDoc}
                      className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                      {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Subir
                    </button>
                  </div>

                  {/* Lista de docs */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {docs.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">Sin documentos adjuntos</p>
                    )}
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover border border-surface-border group">
                        <FileText className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500">{doc.document_type} · {formatDate(doc.created_at)}</p>
                        </div>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1 opacity-0 group-hover:opacity-100">
                          <Download className="w-3 h-3" />
                        </a>
                        <button onClick={() => deleteDoc(doc.id)} className="btn-ghost p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

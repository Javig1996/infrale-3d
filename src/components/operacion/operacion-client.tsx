"use client";

import { useState, useRef } from "react";
import { useRouter }        from "next/navigation";
import { createClient }     from "@/lib/supabase/client";
import { useToast }         from "@/components/ui/toast";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  ChevronDown, ChevronRight, FileText, Upload,
  Download, Loader2, Plus, Save, Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type TechInfo = {
  id: string; manufacturer: string; model: string; serial_number: string;
  installation_date: string; warranty_expiry: string; specifications: Record<string, string>; notes: string;
};
type DocRow = {
  id: string; name: string; file_url: string; file_size: number;
  document_type: string; created_at: string;
};
type ElementRow = {
  id: string; name: string; element_type: string; ifc_guid: string; properties: Record<string, unknown>;
  element_technical_info: TechInfo[];
  element_documents: DocRow[];
};

const DOC_TYPES = ["plano", "manual", "certificado", "foto", "informe", "otro"];

const TECH_FIELDS: { key: keyof TechInfo; label: string; type: string; span?: boolean }[] = [
  { key: "manufacturer",      label: "Fabricante",     type: "text" },
  { key: "model",             label: "Modelo",         type: "text" },
  { key: "serial_number",     label: "N° de Serie",    type: "text", span: true },
  { key: "installation_date", label: "Instalación",    type: "date" },
  { key: "warranty_expiry",   label: "Garantía hasta", type: "date" },
];

interface Props { projectId: string; elements: ElementRow[] }

export function OperacionClient({ projectId, elements }: Props) {
  const router              = useRouter();
  const toast               = useToast();
  const [expanded, setExp]  = useState<string | null>(null);
  const [savingTech, setST] = useState<string | null>(null);
  const [uploadingDoc, setUD]= useState<string | null>(null);
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const [activeUploadEl, setAU] = useState<string | null>(null);
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
    setTF(prev => ({
      ...prev,
      [elId]: { ...(techForms[elId] ?? getForm(elements.find(e => e.id === elId)!)), [key]: val },
    }));
  }

  async function saveTech(el: ElementRow) {
    setST(el.id);
    try {
      const supabase = createClient();
      const form     = getForm(el);
      const existing = el.element_technical_info?.[0];

      const payload = {
        manufacturer:      form.manufacturer      || null,
        model:             form.model             || null,
        serial_number:     form.serial_number     || null,
        installation_date: form.installation_date || null,
        warranty_expiry:   form.warranty_expiry   || null,
        notes:             form.notes             || null,
      };

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("element_technical_info").update(payload).eq("id", existing.id);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("element_technical_info").insert({ element_id: el.id, project_id: projectId, ...payload });
      }
      toast.success("Ficha técnica guardada", { description: el.name });
      router.refresh();
    } catch {
      toast.error("Error al guardar ficha");
    } finally {
      setST(null);
    }
  }

  async function uploadDoc(el: ElementRow, file: File) {
    setUD(el.id);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const formData = new FormData();
      formData.append("file",       file);
      formData.append("element_id", el.id);
      formData.append("project_id", projectId);
      formData.append("user_id",    user.id);
      formData.append("doc_type",   docType);

      const res = await fetch("/api/documentos/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error de carga");
      toast.success("Documento subido", { description: file.name });
      router.refresh();
    } catch {
      toast.error("Error al subir documento");
    } finally {
      setUD(null);
    }
  }

  async function deleteDoc(docId: string, docName: string) {
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("element_documents").delete().eq("id", docId);
      toast.success("Documento eliminado", { description: docName });
      router.refresh();
    } catch {
      toast.error("Error al eliminar documento");
    }
  }

  async function addElement() {
    if (!newEl.name) return;
    setAE(true);
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
      setAddEl(false);
      setNewEl({ name: "", element_type: "" });
      router.refresh();
    } catch {
      toast.error("Error al agregar elemento");
    } finally {
      setAE(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={() => setAddEl(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Agregar elemento
        </button>
      </div>

      {/* Modal nuevo elemento */}
      <Modal open={addEl} onClose={() => setAddEl(false)} title="Nuevo elemento">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              className="input-field"
              placeholder="Ej: Bomba centrífuga B-01"
              value={newEl.name}
              onChange={e => setNewEl(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <input
              className="input-field"
              placeholder="Ej: Bomba, Compresor, Panel..."
              value={newEl.element_type}
              onChange={e => setNewEl(p => ({ ...p, element_type: e.target.value }))}
            />
          </div>
        </div>
        <ModalFooter>
          <button onClick={() => setAddEl(false)} className="btn-secondary">Cancelar</button>
          <button onClick={addElement} disabled={addingEl || !newEl.name} className="btn-primary">
            {addingEl && <Loader2 className="w-4 h-4 animate-spin" />} Agregar
          </button>
        </ModalFooter>
      </Modal>

      {/* Estado vacío */}
      {elements.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText className="w-5 h-5 text-slate-500" />
            </div>
            <p className="empty-state-title">Sin elementos registrados</p>
            <p className="empty-state-desc">
              Agrega elementos para gestionar sus fichas técnicas y documentación.
            </p>
            <button onClick={() => setAddEl(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Agregar elemento
            </button>
          </div>
        </div>
      )}

      {/* Lista de elementos */}
      {elements.map(el => {
        const isOpen = expanded === el.id;
        const form   = getForm(el);
        const docs   = el.element_documents ?? [];
        const hasFicha = !!el.element_technical_info?.[0];

        return (
          <div key={el.id} className="glass-card overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExp(isOpen ? null : el.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-hover/50 transition-colors text-left"
            >
              {isOpen
                ? <ChevronDown  className="w-4 h-4 text-slate-500 shrink-0" />
                : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{el.name}</p>
                <p className="text-xs text-slate-500">{el.element_type}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasFicha && (
                  <span className="chip-success text-[10px] px-1.5 py-0.5">Ficha ✓</span>
                )}
                {docs.length > 0 && (
                  <span className="chip-default text-[10px] px-1.5 py-0.5">
                    {docs.length} doc{docs.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-surface-border">
                {/* Layout en tabs en mobile, grid en desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">

                  {/* Ficha técnica */}
                  <div className="p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Ficha técnica
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {TECH_FIELDS.map(f => (
                        <div key={f.key} className={f.span ? "col-span-2" : ""}>
                          <label className="label">{f.label}</label>
                          <input
                            type={f.type}
                            className="input-field text-sm"
                            value={(form as Record<string, string>)[f.key] ?? ""}
                            onChange={e => setField(el.id, f.key as keyof TechInfo, e.target.value)}
                          />
                        </div>
                      ))}
                      <div className="col-span-2">
                        <label className="label">Notas</label>
                        <textarea
                          className="input-field text-sm resize-none" rows={2}
                          value={form.notes ?? ""}
                          onChange={e => setField(el.id, "notes", e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveTech(el)}
                      disabled={savingTech === el.id}
                      className="btn-primary text-xs w-full justify-center"
                    >
                      {savingTech === el.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Save className="w-3.5 h-3.5" />}
                      Guardar ficha
                    </button>
                  </div>

                  {/* Documentos */}
                  <div className="p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Documentos adjuntos
                    </h4>

                    {/* Upload */}
                    <div className="flex gap-2">
                      <select
                        className="input-field text-sm flex-1"
                        value={docType}
                        onChange={e => setDT(e.target.value)}
                      >
                        {DOC_TYPES.map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f && activeUploadEl) {
                            const el = elements.find(el => el.id === activeUploadEl);
                            if (el) uploadDoc(el, f);
                          }
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                      <button
                        onClick={() => { setAU(el.id); fileInputRef.current?.click(); }}
                        disabled={uploadingDoc === el.id}
                        className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                      >
                        {uploadingDoc === el.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Upload className="w-3.5 h-3.5" />}
                        Subir
                      </button>
                    </div>

                    {/* Lista docs */}
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {docs.length === 0 && (
                        <div className="text-center py-6">
                          <p className="text-xs text-slate-500">Sin documentos adjuntos</p>
                        </div>
                      )}
                      {docs.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover border border-surface-border group"
                        >
                          <FileText className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-200 truncate">{doc.name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{doc.document_type} · {formatDate(doc.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-icon w-6 h-6"
                              title="Descargar"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => deleteDoc(doc.id, doc.name)}
                              className="btn-icon w-6 h-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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

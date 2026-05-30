"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard, CheckCircle2, FileText, Cpu,
  Wrench, Calendar, History, ClipboardList, Flag,
  Download, ArrowLeft, Box,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

/* ────────────── TYPES ────────────── */
type Module = "pl" | "cp" | "op" | "mt";

interface ElementProgress {
  progress_percentage: number;
  status: string;
  notes?: string;
  updated_at?: string;
}
interface TechInfo {
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  installation_date?: string;
  warranty_expiry?: string;
  notes?: string;
}
interface DocRow {
  id: string; name: string; file_url: string;
  document_type: string; created_at: string; file_size?: number;
}
interface ElementRow {
  id: string; name: string; element_type: string; ifc_guid: string;
  element_progress: ElementProgress[];
  element_technical_info: TechInfo[];
  element_documents: DocRow[];
}
interface MaintenanceRecord {
  id: string; element_id: string;
  maintenance_date: string;
  type: "preventivo" | "correctivo" | "predictivo";
  technician_name?: string | null;
  description?: string | null;
  result?: string | null;
  next_maintenance_date?: string | null;
}
export interface CockpitShellProps {
  fileUrl: string;
  modelName: string;
  modelId: string;
  projectId: string;
  projectName: string;
  sizeBytes?: number | null;
  profile: { full_name?: string | null; email: string } | null;
  elements: ElementRow[];
  maintenanceRecords: MaintenanceRecord[];
}

/* ────────────── CONSTANTS ────────────── */
const MODULES: { id: Module; name: string; code: string; color: string; textColor: string }[] = [
  { id: "pl", name: "Planificación", code: "PL", color: "#0E4DA4", textColor: "#fff" },
  { id: "cp", name: "Control",       code: "CP", color: "#1257B4", textColor: "#fff" },
  { id: "op", name: "Operación",     code: "OP", color: "#06B6D4", textColor: "#042a31" },
  { id: "mt", name: "Mantenimiento", code: "MT", color: "#0A3C80", textColor: "#fff" },
];

const NAV_SECTIONS: Record<Module, { id: string; label: string; Icon: React.ElementType }[]> = {
  pl: [
    { id: "dash",   label: "Dashboard",  Icon: LayoutDashboard },
    { id: "avance", label: "Avance",     Icon: CheckCircle2 },
    { id: "docs",   label: "Documentos", Icon: FileText },
  ],
  cp: [
    { id: "dash",  label: "Dashboard", Icon: LayoutDashboard },
    { id: "hitos", label: "Hitos",     Icon: Flag },
    { id: "rep",   label: "Reportes",  Icon: ClipboardList },
  ],
  op: [
    { id: "dash",   label: "Dashboard",  Icon: LayoutDashboard },
    { id: "fichas", label: "Fichas téc.", Icon: Cpu },
    { id: "docs",   label: "Documentos", Icon: FileText },
  ],
  mt: [
    { id: "dash", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ot",   label: "Órdenes",   Icon: Wrench },
    { id: "cal",  label: "Calendario",Icon: Calendar },
    { id: "hist", label: "Historial", Icon: History },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  completado: "#1F9D6B",
  en_progreso: "#D9930B",
  bloqueado: "#D8463E",
  pendiente: "#5E768F",
};

/* ────────────── HELPERS ────────────── */
function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function MiniStat({ label, value, unit, color = "#E6EEF7" }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="mini-stat-val" style={{ color }}>
        {value}
        {unit && <span style={{ fontSize: 11, color: "#5E8aad", marginLeft: 2 }}>{unit}</span>}
      </div>
      <div className="mini-stat-label">{label}</div>
    </div>
  );
}

function BarChart({ data, color = "#06B6D4", height = 46 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: "2px 2px 0 0", minHeight: 2,
          height: `${(d / max) * 100}%`,
          background: i === data.length - 1 ? color : "rgba(110,160,221,0.4)",
        }} />
      ))}
    </div>
  );
}

function ProgressBar({ value, color, small }: { value: number; color?: string; small?: boolean }) {
  const h = small ? 4 : 5;
  const bg = color || (value >= 100 ? "#1F9D6B" : value >= 50 ? "#06B6D4" : "#1257B4");
  return (
    <div style={{ height: h, background: "rgba(37,57,79,0.5)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: bg, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

/* ────────────── RIGHT PANEL CONTENT ────────────── */
function RightPanelContent({
  module, page, elements, maintenanceRecords
}: {
  module: Module; page: string;
  elements: ElementRow[];
  maintenanceRecords: MaintenanceRecord[];
}) {
  const key = `${module}/${page}`;

  const totalEls = elements.length;
  const completedEls = elements.filter(e => (e.element_progress?.[0]?.progress_percentage ?? 0) >= 100).length;
  const overallPct = totalEls === 0 ? 0 : Math.round(
    elements.reduce((a, e) => a + (e.element_progress?.[0]?.progress_percentage ?? 0), 0) / totalEls
  );

  switch (key) {
    /* ── PL Dashboard ── */
    case "pl/dash":
      return (
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <MiniStat label="Avance global" value={overallPct} unit="%" color="#22D3EE" />
            <MiniStat label="Completados"   value={completedEls} />
            <MiniStat label="Total"         value={totalEls} />
          </div>
          <div className="cockpit-label">Avance por estado</div>
          {(["completado", "en_progreso", "bloqueado", "pendiente"] as const).map(st => {
            const count = elements.filter(e => (e.element_progress?.[0]?.status ?? "pendiente") === st).length;
            const pct = totalEls > 0 ? Math.round(count / totalEls * 100) : 0;
            return (
              <div key={st} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4, color: "#93A7BD" }}>
                  <span style={{ textTransform: "capitalize" }}>{st.replace("_", " ")}</span>
                  <span style={{ fontFamily: "monospace" }}>{count}</span>
                </div>
                <ProgressBar value={pct} color={STATUS_COLORS[st]} small />
              </div>
            );
          })}
          <div style={{ height: 1, background: "rgba(70,100,135,.2)", margin: "14px 0" }} />
          <div className="cockpit-label">Curva de avance</div>
          <BarChart data={[10, 22, 35, 48, 62, 75, overallPct]} color="#06B6D4" height={52} />
        </div>
      );

    /* ── PL Avance ── */
    case "pl/avance":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {elements.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#5E768F", fontSize: 12.5 }}>
              Sin elementos registrados
            </div>
          )}
          {elements.slice(0, 20).map(el => {
            const prog = el.element_progress?.[0];
            const pct = prog?.progress_percentage ?? 0;
            const st = prog?.status ?? "pendiente";
            return (
              <div key={el.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(37,57,79,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12.5 }}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{el.name}</span>
                  <span style={{ fontFamily: "monospace", color: "#22D3EE", flex: "none" }}>{pct}%</span>
                </div>
                <ProgressBar value={pct} />
                <div style={{ fontSize: 10, color: STATUS_COLORS[st] || "#5E768F", marginTop: 3, textTransform: "capitalize" }}>
                  {st.replace("_", " ")} · {el.element_type}
                </div>
              </div>
            );
          })}
          {elements.length > 20 && (
            <div style={{ textAlign: "center", fontSize: 11, color: "#5E768F", padding: "10px 0" }}>
              +{elements.length - 20} elementos más
            </div>
          )}
        </div>
      );

    /* ── PL / OP Documentos ── */
    case "pl/docs":
    case "op/docs": {
      const allDocs = elements.flatMap(el =>
        (el.element_documents ?? []).map(d => ({ ...d, elementName: el.name }))
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allDocs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#5E768F", fontSize: 12.5 }}>Sin documentos</div>
          )}
          {allDocs.slice(0, 15).map(doc => (
            <div key={doc.id} style={{ display: "flex", gap: 10, padding: "9px 10px", background: "rgba(20,38,60,0.5)", borderRadius: 8, border: "1px solid rgba(37,57,79,0.5)" }}>
              <FileText size={14} style={{ color: "#6FA0DD", flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                <div style={{ fontSize: 10, color: "#93A7BD", marginTop: 2 }}>{doc.elementName} · {doc.document_type}</div>
              </div>
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                style={{ color: "#06B6D4", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Download size={13} />
              </a>
            </div>
          ))}
        </div>
      );
    }

    /* ── CP Dashboard ── */
    case "cp/dash":
      return (
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <MiniStat label="Avance" value={overallPct} unit="%" color="#22D3EE" />
            <MiniStat label="Elementos" value={totalEls} />
            <MiniStat label="OK" value={completedEls} color="#1F9D6B" />
          </div>
          <div className="cockpit-label">Distribución por tipo</div>
          {Object.entries(
            elements.reduce<Record<string, number>>((acc, el) => {
              acc[el.element_type || "General"] = (acc[el.element_type || "General"] || 0) + 1;
              return acc;
            }, {})
          ).slice(0, 6).map(([type, count]) => (
            <div key={type} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3, color: "#93A7BD" }}>
                <span>{type}</span>
                <span style={{ fontFamily: "monospace" }}>{count}</span>
              </div>
              <ProgressBar value={totalEls > 0 ? count / totalEls * 100 : 0} color="#6FA0DD" small />
            </div>
          ))}
        </div>
      );

    /* ── CP Hitos ── */
    case "cp/hitos": {
      const byType = elements.reduce<Record<string, ElementRow[]>>((acc, el) => {
        const t = el.element_type || "General";
        (acc[t] ??= []).push(el);
        return acc;
      }, {});
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(byType).slice(0, 8).map(([type, els]) => {
            const avg = Math.round(els.reduce((a, e) => a + (e.element_progress?.[0]?.progress_percentage ?? 0), 0) / els.length);
            return (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 99, border: `2px solid ${avg >= 100 ? "#1F9D6B" : "rgba(70,100,135,.5)"}`,
                  background: avg >= 100 ? "#1F9D6B" : "transparent",
                  color: avg >= 100 ? "#05121f" : "#93A7BD",
                  display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {avg >= 100 ? "✓" : `${avg}%`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{type}</div>
                  <div style={{ marginTop: 4 }}><ProgressBar value={avg} /></div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    /* ── CP Reportes ── */
    case "cp/rep":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            ["Avance de obra", "RPT-001", "ok"],
            ["Control de calidad", "RPT-002", "warn"],
            ["Seguridad y salud", "RPT-003", "ok"],
            ["Acta de reunión", "RPT-004", "ok"],
          ].map(([name, code, status]) => (
            <div key={code} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", border: "1px solid rgba(70,100,135,0.3)", borderRadius: 9 }}>
              <ClipboardList size={16} style={{ color: "#6FA0DD", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{name}</div>
                <div style={{ fontSize: 10.5, color: "#93A7BD", fontFamily: "monospace" }}>{code}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                background: status === "ok" ? "rgba(31,157,107,0.15)" : "rgba(217,147,11,0.15)",
                color: status === "ok" ? "#1F9D6B" : "#D9930B",
                border: `1px solid ${status === "ok" ? "rgba(31,157,107,0.3)" : "rgba(217,147,11,0.3)"}`,
              }}>
                {status === "ok" ? "Aprobado" : "En revisión"}
              </span>
            </div>
          ))}
        </div>
      );

    /* ── OP Dashboard ── */
    case "op/dash": {
      const withFicha = elements.filter(e => e.element_technical_info?.length > 0).length;
      const withDocs = elements.filter(e => (e.element_documents?.length ?? 0) > 0).length;
      return (
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <MiniStat label="Total"   value={totalEls} />
            <MiniStat label="Con ficha" value={withFicha} color="#22D3EE" />
            <MiniStat label="Con docs"  value={withDocs}  color="#1F9D6B" />
          </div>
          <div className="cockpit-label">Elementos con ficha técnica</div>
          {elements.filter(e => e.element_technical_info?.length > 0).slice(0, 6).map(el => {
            const ti = el.element_technical_info[0];
            return (
              <div key={el.id} style={{ padding: "9px 10px", background: "rgba(20,38,60,0.4)", borderRadius: 8, border: "1px solid rgba(37,57,79,0.4)", marginBottom: 7 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>{el.name}</div>
                {ti.manufacturer && (
                  <div style={{ fontSize: 10.5, color: "#93A7BD" }}>
                    {ti.manufacturer}{ti.model ? ` · ${ti.model}` : ""}
                  </div>
                )}
              </div>
            );
          })}
          {withFicha === 0 && (
            <div style={{ textAlign: "center", color: "#5E768F", fontSize: 11.5, padding: "20px 0" }}>Sin fichas técnicas registradas</div>
          )}
        </div>
      );
    }

    /* ── OP Fichas técnicas ── */
    case "op/fichas": {
      const withFicha = elements.filter(e => e.element_technical_info?.length > 0);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {withFicha.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#5E768F", fontSize: 12.5 }}>Sin fichas técnicas</div>
          )}
          {withFicha.slice(0, 10).map(el => {
            const ti = el.element_technical_info[0];
            const fields = [
              ["Fabricante", ti.manufacturer],
              ["Modelo",     ti.model],
              ["N° Serie",   ti.serial_number],
              ["Instalación",ti.installation_date ? formatDate(ti.installation_date) : null],
              ["Garantía",   ti.warranty_expiry   ? formatDate(ti.warranty_expiry)   : null],
            ].filter(([, v]) => v);
            return (
              <div key={el.id} style={{ padding: "11px 12px", background: "rgba(20,38,60,0.5)", borderRadius: 9, border: "1px solid rgba(37,57,79,0.4)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{el.name}</div>
                {fields.map(([k, v]) => (
                  <div key={k as string} style={{ display: "flex", gap: 8, paddingBottom: 5, borderBottom: "1px dashed rgba(37,57,79,0.5)", marginBottom: 5, fontSize: 11.5 }}>
                    <span style={{ color: "#5E768F", width: 72, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#E6EEF7" }}>{v}</span>
                  </div>
                ))}
                {ti.notes && <div style={{ fontSize: 11, color: "#93A7BD", marginTop: 4 }}>{ti.notes}</div>}
              </div>
            );
          })}
        </div>
      );
    }

    /* ── MT Dashboard ── */
    case "mt/dash": {
      const openRecords = maintenanceRecords.filter(r => {
        if (!r.next_maintenance_date) return false;
        return new Date(r.next_maintenance_date) >= new Date();
      });
      return (
        <div>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            <MiniStat label="Registros" value={maintenanceRecords.length} />
            <MiniStat label="Próximos"  value={openRecords.length} color="#D9930B" />
            <MiniStat label="Elementos" value={new Set(maintenanceRecords.map(r => r.element_id)).size} />
          </div>
          <div className="cockpit-label">Últimas intervenciones</div>
          {maintenanceRecords.slice(0, 5).map(r => {
            const el = elements.find(e => e.id === r.element_id);
            const typeColor = r.type === "correctivo" ? "#D8463E" : r.type === "preventivo" ? "#1F9D6B" : "#D9930B";
            return (
              <div key={r.id} style={{ display: "flex", gap: 10, paddingBottom: 11, borderBottom: "1px solid rgba(37,57,79,0.4)", marginBottom: 11 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: typeColor, flexShrink: 0, marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.description || "Mantenimiento"}</div>
                  <div style={{ fontSize: 10.5, color: "#93A7BD", marginTop: 2 }}>
                    {el?.name || "—"} · {formatDate(r.maintenance_date)}
                  </div>
                </div>
              </div>
            );
          })}
          {maintenanceRecords.length === 0 && (
            <div style={{ textAlign: "center", color: "#5E768F", fontSize: 11.5, padding: "20px 0" }}>Sin registros de mantenimiento</div>
          )}
        </div>
      );
    }

    /* ── MT Órdenes ── */
    case "mt/ot":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {maintenanceRecords.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#5E768F", fontSize: 12.5 }}>Sin órdenes de trabajo</div>
          )}
          {maintenanceRecords.map(r => {
            const el = elements.find(e => e.id === r.element_id);
            const typeColor = r.type === "correctivo" ? "#D8463E" : r.type === "preventivo" ? "#1F9D6B" : "#D9930B";
            return (
              <div key={r.id} style={{ padding: 11, borderRadius: 9, background: "rgba(20,38,60,0.4)", border: "1px solid rgba(37,57,79,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "#22D3EE", fontFamily: "monospace" }}>
                    OT-{r.id.slice(-4).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: `${typeColor}22`, color: typeColor, border: `1px solid ${typeColor}44`, textTransform: "capitalize" }}>
                    {r.type}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>{r.description || "Mantenimiento"}</div>
                <div style={{ fontSize: 10.5, color: "#93A7BD" }}>
                  {el?.name || "—"} · {r.technician_name || "Sin asignar"}
                </div>
                <div style={{ fontSize: 10, color: "#5E768F", marginTop: 3, fontFamily: "monospace" }}>
                  {formatDate(r.maintenance_date)}
                  {r.next_maintenance_date && ` → próx. ${formatDate(r.next_maintenance_date)}`}
                </div>
              </div>
            );
          })}
        </div>
      );

    /* ── MT Historial ── */
    case "mt/hist":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {maintenanceRecords.map((r, i) => {
            const el = elements.find(e => e.id === r.element_id);
            const typeColor = r.type === "correctivo" ? "#D8463E" : r.type === "preventivo" ? "#1F9D6B" : "#D9930B";
            return (
              <div key={r.id} style={{ display: "flex", gap: 12, paddingBottom: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: typeColor, flexShrink: 0 }} />
                  {i < maintenanceRecords.length - 1 && (
                    <span style={{ width: 2, flex: 1, background: "rgba(37,57,79,0.5)", marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.description || "Mantenimiento"}</div>
                  <div style={{ fontSize: 10.5, color: "#93A7BD", marginTop: 2, fontFamily: "monospace" }}>
                    {formatDate(r.maintenance_date)} · {el?.name || "—"}
                  </div>
                  {r.result && <div style={{ fontSize: 11, color: "#5E768F", marginTop: 3 }}>{r.result}</div>}
                </div>
              </div>
            );
          })}
          {maintenanceRecords.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#5E768F", fontSize: 12.5 }}>Sin historial registrado</div>
          )}
        </div>
      );

    /* ── MT Calendario ── */
    case "mt/cal": {
      const days = ["L", "M", "X", "J", "V", "S", "D"];
      const events: Record<number, { type: string; desc: string }> = {};
      maintenanceRecords.forEach(r => {
        const d = new Date(r.maintenance_date).getDate();
        events[d] = { type: r.type, desc: r.description || "Mantenimiento" };
      });
      const firstDay = 3;
      const typeColor = (t: string) => t === "correctivo" ? "#D8463E" : t === "preventivo" ? "#1F9D6B" : "#D9930B";
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 5 }}>
            {days.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#5E768F", fontWeight: 600, fontFamily: "monospace" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - firstDay + 1;
              const valid = day >= 1 && day <= 31;
              const ev = events[day];
              return (
                <div key={i} style={{
                  aspectRatio: "1/.82", borderRadius: 7, border: `1px solid ${valid ? "rgba(37,57,79,0.5)" : "transparent"}`,
                  background: valid ? "rgba(20,38,60,0.5)" : "transparent", padding: 5, position: "relative", overflow: "hidden",
                }}>
                  {valid && <span style={{ fontSize: 10, color: "#5E768F", fontFamily: "monospace" }}>{day}</span>}
                  {ev && (
                    <div style={{ marginTop: 2, fontSize: 8, lineHeight: 1.2, color: "#E6EEF7", borderLeft: `2px solid ${typeColor(ev.type)}`, paddingLeft: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return <div style={{ color: "#5E768F", fontSize: 12, textAlign: "center", paddingTop: 40 }}>Selecciona una sección</div>;
  }
}

/* ────────────── COCKPIT SHELL ────────────── */
export function CockpitShell({
  fileUrl, modelName, projectId, projectName,
  sizeBytes, profile, elements, maintenanceRecords,
}: CockpitShellProps) {
  const [activeModule, setActiveModule] = useState<Module>("pl");
  const [activePage, setActivePage]     = useState("dash");

  const switchModule = useCallback((mod: Module) => {
    setActiveModule(mod);
    setActivePage("dash");
  }, []);

  const switchPage = useCallback((page: string) => {
    setActivePage(page);
  }, []);

  const mod   = MODULES.find(m => m.id === activeModule)!;
  const nav   = NAV_SECTIONS[activeModule];
  const iframeUrl = `/ifc-viewer/index.html?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(modelName)}`;
  const userName = profile?.full_name || profile?.email || "Usuario";
  const fileSizeMB = sizeBytes ? `${(sizeBytes / 1024 / 1024).toFixed(1)} MB` : "";

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#070D16", zIndex: 50 }}>

      {/* ── Visor 3D full-bleed ── */}
      <div style={{ position: "absolute", inset: 0 }}>
        <iframe
          src={iframeUrl}
          title={`Visor IFC — ${modelName}`}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          allow="fullscreen"
        />
      </div>

      {/* ── TOP BAR ── */}
      <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, pointerEvents: "none" }}>

        {/* Logo + módulos */}
        <div className="glass-panel" style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 16, pointerEvents: "auto" }}>
          {/* Logo */}
          <Link href={`/proyectos/${projectId}`} title="Volver al proyecto" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 24, height: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2.5 }}>
              <span style={{ background: "#2E6FD6", borderRadius: 2 }} />
              <span style={{ background: "#6FA0DD", borderRadius: 2 }} />
              <span style={{ background: "#06B6D4", borderRadius: 2 }} />
              <span style={{ background: "#1257B4", borderRadius: 2 }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", whiteSpace: "nowrap" }}>
              INFRALE <span style={{ color: "#06B6D4", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>3D</span>
            </span>
          </Link>

          {/* Separador */}
          <span style={{ width: 1, height: 22, background: "rgba(70,100,135,0.4)", flexShrink: 0 }} />

          {/* Module pills */}
          <div style={{ display: "flex", gap: 4 }}>
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => switchModule(m.id)}
                className="module-pill"
                style={activeModule === m.id ? { background: m.color, color: m.textColor } : {}}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* User / Notifications */}
        <div className="glass-panel" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
          {/* Proyecto */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#06B6D4", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{projectName}</span>
          </div>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: 99,
            background: "linear-gradient(135deg,#0E4DA4,#06B6D4)",
            display: "grid", placeItems: "center",
            fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {initials(userName)}
          </div>
          {/* Back link */}
          <Link
            href={`/proyectos/${projectId}`}
            title="Salir del cockpit"
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(70,100,135,0.35)", background: "transparent", color: "#93A7BD", display: "grid", placeItems: "center", textDecoration: "none" }}
          >
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>

      {/* ── LEFT DOCK ── */}
      <div style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", animation: "panel-in 0.2s ease-out" }}>
        <div className="glass-panel" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => switchPage(id)}
              title={label}
              className={`dock-btn${activePage === id ? " active" : ""}`}
            >
              <Icon size={19} />
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT CONTEXTUAL PANEL ── */}
      <div
        key={`${activeModule}/${activePage}`}
        style={{ position: "absolute", right: 18, top: 84, animation: "panel-in 0.2s ease-out" }}
      >
        <div className="glass-panel dark-scroll" style={{ padding: 16, width: 340, maxHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Panel header */}
          <div className="cockpit-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span>{mod.name} — {nav.find(n => n.id === activePage)?.label || activePage}</span>
            <span style={{ color: mod.color, fontWeight: 700 }}>{mod.code}</span>
          </div>
          {/* Panel content */}
          <RightPanelContent
            module={activeModule}
            page={activePage}
            elements={elements}
            maintenanceRecords={maintenanceRecords}
          />
        </div>
      </div>

      {/* ── BOTTOM STRIP ── */}
      <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)" }}>
        <div className="glass-panel" style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: 24, whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Box size={13} style={{ color: "#5E8aad" }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E8aad" }}>MODELO</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{modelName}</span>
          </div>
          <span style={{ width: 1, height: 18, background: "rgba(70,100,135,0.4)" }} />
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#93A7BD" }}>
            {elements.length} elementos{fileSizeMB ? ` · ${fileSizeMB}` : ""}
          </div>
          <span style={{ width: 1, height: 18, background: "rgba(70,100,135,0.4)" }} />
          {/* Active module indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: mod.color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#E6EEF7" }}>{mod.name}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

"use client";

import { useMemo, useRef } from "react";
import { Edit2, Trash2 } from "lucide-react";

export interface GanttActivity {
  id:           string;
  name:         string;
  start_date:   string;
  end_date:     string;
  member_name?: string;
  element_name?: string | null;
  parent_id?:   string | null;
  is_critical:  boolean;
}

interface Props {
  activities:       GanttActivity[];
  onEdit:           (id: string) => void;
  onDelete:         (id: string) => void;
  onHoverElement?:  (name: string | null) => void;
}

const LEFT_W      = 240;
const ROW_H       = 40;
const HEADER_H    = 28;
const MIN_PPD     = 1.5;
const MAX_PPD     = 18;

function dateDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function fmtShortMonth(d: Date): string {
  return d.toLocaleString("es", { month: "short", year: "2-digit" });
}

export function GanttChart({ activities, onEdit, onDelete, onHoverElement }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    // Top-level first (sorted by start), then children grouped under parent
    const roots    = activities.filter(a => !a.parent_id).sort((a, b) =>
      a.start_date.localeCompare(b.start_date));
    const children = activities.filter(a => a.parent_id);
    const result: Array<{ act: GanttActivity; depth: number }> = [];
    for (const r of roots) {
      result.push({ act: r, depth: 0 });
      const kids = children
        .filter(c => c.parent_id === r.id)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
      for (const k of kids) result.push({ act: k, depth: 1 });
    }
    // Any children whose parent was not found
    for (const c of children) {
      if (!result.find(x => x.act.id === c.id))
        result.push({ act: c, depth: 1 });
    }
    return result;
  }, [activities]);

  const { projectStart, projectEnd, ppd, timelineW, months, todayOffset } = useMemo(() => {
    if (!activities.length) {
      const now = new Date();
      return {
        projectStart: now, projectEnd: addDays(now, 90),
        ppd: 8, timelineW: 720,
        months: [] as Array<{ label: string; left: number; width: number }>,
        todayOffset: 0,
      };
    }

    const starts = activities.map(a => new Date(a.start_date));
    const ends   = activities.map(a => new Date(a.end_date));
    const pStart = new Date(Math.min(...starts.map(d => d.getTime())));
    const pEnd   = new Date(Math.max(...ends.map(d => d.getTime())));
    // Add 5-day padding on each side
    const visStart = addDays(pStart, -5);
    const visEnd   = addDays(pEnd, 5);
    const totalDays = Math.max(1, dateDiff(visStart, visEnd));
    const p = Math.max(MIN_PPD, Math.min(MAX_PPD, Math.round(900 / totalDays)));
    const tw = Math.max(900, totalDays * p);

    // Month headers
    const monthHeaders: Array<{ label: string; left: number; width: number }> = [];
    let cur = new Date(visStart.getFullYear(), visStart.getMonth(), 1);
    while (cur <= visEnd) {
      const mEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
      const cStart = cur < visStart ? visStart : cur;
      const cEnd   = mEnd > visEnd   ? visEnd   : mEnd;
      const left   = dateDiff(visStart, cStart) * p;
      const width  = (dateDiff(cStart, cEnd) + 1) * p;
      monthHeaders.push({ label: fmtShortMonth(cur), left, width });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    const today       = new Date();
    const todayOff    = today >= visStart && today <= visEnd
      ? dateDiff(visStart, today) * p
      : -1;

    return {
      projectStart: visStart, projectEnd: visEnd,
      ppd: p, timelineW: tw, months: monthHeaders, todayOffset: todayOff,
    };
  }, [activities]);

  function barProps(act: GanttActivity) {
    const s    = new Date(act.start_date);
    const e    = new Date(act.end_date);
    const left = Math.max(0, dateDiff(projectStart, s)) * ppd;
    const w    = Math.max(4, dateDiff(s, e) * ppd);
    return { left, width: w };
  }

  const weekLines = useMemo(() => {
    const lines: number[] = [];
    let d = 0;
    while (d < dateDiff(projectStart, projectEnd)) {
      lines.push(d * ppd);
      d += 7;
    }
    return lines;
  }, [projectStart, projectEnd, ppd]);

  const totalH = HEADER_H + sorted.length * ROW_H;

  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <p className="text-sm">No hay actividades. Haz clic en &quot;+ Nueva actividad&quot; para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-auto" style={{ maxHeight: "520px" }}>
      {/* ── Columna izquierda (sticky) ── */}
      <div
        className="shrink-0 sticky left-0 z-10 bg-brand-950/95 border-r border-surface-border"
        style={{ width: LEFT_W }}
      >
        {/* Header izquierdo */}
        <div
          className="flex items-center px-3 border-b border-surface-border bg-brand-950/95 sticky top-0 z-20"
          style={{ height: HEADER_H }}
        >
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Actividad
          </span>
        </div>

        {/* Filas de actividades */}
        {sorted.map(({ act, depth }) => (
          <div
            key={act.id}
            className="flex items-center gap-1 border-b border-surface-border/50 group hover:bg-surface-hover/30 transition-colors"
            style={{ height: ROW_H, paddingLeft: 8 + depth * 16 }}
            onMouseEnter={() => act.element_name && onHoverElement?.(act.element_name)}
            onMouseLeave={() => onHoverElement?.(null)}
          >
            {/* Indicador crítico / normal */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: act.is_critical ? "#ef4444" : depth === 0 ? "#94a3b8" : "#3b82f6" }}
            />

            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-300 truncate leading-tight">{act.name}</p>
              {act.member_name && (
                <p className="text-[10px] text-slate-600 truncate leading-none mt-0.5">
                  {act.member_name}
                </p>
              )}
            </div>

            {/* Botones de acción (visible on hover) */}
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1">
              <button
                onClick={() => onEdit(act.id)}
                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-surface-hover"
                aria-label="Editar"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDelete(act.id)}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                aria-label="Eliminar"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Timeline (scrollable horizontalmente) ── */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto">
        <div className="relative" style={{ width: timelineW, height: totalH }}>

          {/* Líneas de semana */}
          {weekLines.map(x => (
            <div
              key={x}
              className="absolute top-0 bottom-0 w-px bg-surface-border/30"
              style={{ left: x }}
            />
          ))}

          {/* Marcador de hoy */}
          {todayOffset >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400/50 z-10"
              style={{ left: todayOffset }}
            >
              <div className="absolute top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
          )}

          {/* Encabezado de meses */}
          <div
            className="sticky top-0 z-10 bg-brand-950/95 border-b border-surface-border"
            style={{ height: HEADER_H }}
          >
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex items-center px-2 border-r border-surface-border/40"
                style={{ left: m.left, width: m.width }}
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Barras de actividades */}
          {sorted.map(({ act }, i) => {
            const { left, width } = barProps(act);
            const top = HEADER_H + i * ROW_H;
            const barColor = act.is_critical
              ? "#ef4444"
              : act.parent_id
                ? "#3b82f6"
                : "#22c55e";
            const durationDays = Math.max(1, dateDiff(new Date(act.start_date), new Date(act.end_date)));

            return (
              <div
                key={act.id}
                className="absolute border-b border-surface-border/30"
                style={{ top, left: 0, right: 0, height: ROW_H }}
              >
                {/* Stripe alternado */}
                {i % 2 === 1 && (
                  <div className="absolute inset-0 bg-white/[0.015]" />
                )}

                {/* Barra */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 rounded flex items-center overflow-hidden"
                  style={{
                    left,
                    width,
                    height: 20,
                    background: barColor,
                    opacity: 0.85,
                  }}
                  title={`${act.name} · ${durationDays}d`}
                >
                  {width > 40 && (
                    <span className="text-[10px] font-medium text-white px-1.5 truncate leading-none">
                      {durationDays}d
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

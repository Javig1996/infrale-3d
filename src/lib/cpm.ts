export interface ActivityNode {
  id: string;
  start_date: string;
  end_date: string;
  predecessors: string[];
}

function dateDiff(a: string, b: string): number {
  return Math.max(1, Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  ));
}

export function computeCriticalPath(activities: ActivityNode[]): Set<string> {
  if (!activities.length) return new Set();

  const map  = new Map(activities.map(a => [a.id, a]));
  const ES   = new Map<string, number>();
  const EF   = new Map<string, number>();
  const LS   = new Map<string, number>();
  const LF   = new Map<string, number>();
  const inFwd = new Set<string>();
  const inBwd = new Set<string>();

  function fwd(id: string): number {
    if (EF.has(id)) return EF.get(id)!;
    if (inFwd.has(id)) return 0; // cycle guard
    inFwd.add(id);
    const a   = map.get(id);
    if (!a) { inFwd.delete(id); return 0; }
    const dur = dateDiff(a.start_date, a.end_date);
    const preds = a.predecessors.filter(p => map.has(p));
    const es  = preds.length ? Math.max(...preds.map(p => fwd(p))) : 0;
    ES.set(id, es);
    EF.set(id, es + dur);
    inFwd.delete(id);
    return EF.get(id)!;
  }

  for (const a of activities) fwd(a.id);

  const efValues = Array.from(EF.values());
  const projectDur = efValues.length ? Math.max(0, ...efValues) : 0;

  // Reverse adjacency
  const succs = new Map<string, string[]>();
  for (const a of activities) {
    for (const p of a.predecessors) {
      if (map.has(p)) {
        if (!succs.has(p)) succs.set(p, []);
        succs.get(p)!.push(a.id);
      }
    }
  }

  function bwd(id: string): number {
    if (LS.has(id)) return LS.get(id)!;
    if (inBwd.has(id)) return projectDur;
    inBwd.add(id);
    const a   = map.get(id);
    if (!a) { inBwd.delete(id); return projectDur; }
    const dur = dateDiff(a.start_date, a.end_date);
    const ss  = succs.get(id) ?? [];
    const lf  = ss.length ? Math.min(...ss.map(s => bwd(s))) : projectDur;
    LF.set(id, lf);
    LS.set(id, lf - dur);
    inBwd.delete(id);
    return LS.get(id)!;
  }

  for (const a of activities) bwd(a.id);

  const critical = new Set<string>();
  for (const a of activities) {
    const float = (LS.get(a.id) ?? 0) - (ES.get(a.id) ?? 0);
    if (float <= 0) critical.add(a.id);
  }

  return critical;
}

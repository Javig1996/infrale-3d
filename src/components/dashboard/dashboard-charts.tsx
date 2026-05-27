"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface ChartData {
  progressByStatus: { name: string; value: number; fill: string }[];
  byType:           { name: string; value: number; fill: string }[];
}

interface Props { data: ChartData }

export function DashboardCharts({ data }: Props) {
  const hasProgress = data.progressByStatus.some(d => d.value > 0);
  const hasTypes    = data.byType.some(d => d.value > 0);

  if (!hasProgress && !hasTypes) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Progreso por estado */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Estado de elementos</h3>
        {hasProgress ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.progressByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                paddingAngle={3} dataKey="value" nameKey="name">
                {data.progressByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f2035", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
                formatter={(v) => [v, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
            Sin datos de progreso aún
          </div>
        )}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {data.progressByStatus.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
              {d.name} ({d.value})
            </div>
          ))}
        </div>
      </div>

      {/* Proyectos por tipo */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Proyectos por tipo</h3>
        {hasTypes ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byType} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f2035", border: "1px solid #1e3a5f", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="value" name="Proyectos" radius={[4, 4, 0, 0]}>
                {data.byType.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-slate-500">
            Sin proyectos creados aún
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Stage = { stage: string; count: number };

const STAGE_COLORS = ["#FBBF24", "#3B82F6", "#A855F7", "#F97316", "#06B6D4", "#22C55E"];

export function PipelineChart({ data }: { data: Stage[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-dark-400">Belum ada pesanan untuk ditampilkan.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--admin-chart-text)" }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="stage" tick={{ fontSize: 12, fill: "var(--admin-chart-text)" }} tickLine={false} axisLine={false} width={90} />
        <Tooltip
          formatter={(value) => [`${value} pesanan`, ""]}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--admin-chart-border)", backgroundColor: "var(--admin-chart-surface)", fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

type Point = { date: string; revenue: number };

export function RevenueChart({ data }: { data: Point[] }) {
  if (data.every((d) => d.revenue === 0)) {
    return <div className="flex h-64 items-center justify-center text-sm text-dark-400">Belum ada data pendapatan 30 hari terakhir.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-chart-grid)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--admin-chart-text)" }} tickLine={false} axisLine={false} interval={Math.ceil(data.length / 8)} />
        <YAxis tick={{ fontSize: 11, fill: "var(--admin-chart-text)" }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v))} width={48} />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), "Pendapatan"]}
          labelStyle={{ color: "var(--admin-chart-text)", fontWeight: 600 }}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--admin-chart-border)", backgroundColor: "var(--admin-chart-surface)", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="revenue" stroke="#E8590C" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

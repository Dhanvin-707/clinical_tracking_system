"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ORDER = ["MILD", "MODERATE", "SEVERE"];

export function AesBySeverity({ data }: { data: Record<string, number> }) {
  const chartData = ORDER.map((key) => ({
    name: key,
    count: data[key] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <XAxis dataKey="name" fontSize={12} />
        <YAxis allowDecimals={false} fontSize={12} />
        <Tooltip />
        <Bar dataKey="count" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

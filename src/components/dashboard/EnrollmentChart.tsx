"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS: Record<string, string> = {
  SCREENING: "var(--color-muted-foreground)",
  ENROLLED: "var(--color-primary)",
  WITHDRAWN: "var(--color-destructive)",
};

export function EnrollmentChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No patients yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name.toUpperCase().replace(" ", "_")] ?? "var(--color-muted-foreground)"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

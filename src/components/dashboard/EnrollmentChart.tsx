"use client";

import { useEffect, useState } from "react";
import PieChart from "../charts/bklit/pie-chart";
import { PieSlice } from "../charts/bklit/pie-slice";
import PieCenter from "../charts/bklit/pie-center";

const COLOURS: Record<string, string> = {
  SCREENING: "rgba(255,255,255,0.45)",
  ENROLLED: "#22d3ee",
  WITHDRAWN: "#fb7185",
};

export function EnrollmentChart({ data }: { data: Record<string, number> }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = Object.entries(data).map(([name, value]) => ({
    label: name.replace("_", " "),
    value,
    color: COLOURS[name.toUpperCase()] ?? "rgba(255,255,255,0.45)",
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        No patients yet.
      </div>
    );
  }

  // Mount guard: bklit's NumberFlow renders a custom element on the client but
  // plain text on the server — render a neutral placeholder until hydrated so
  // server and client first-render match.
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-white">
          {chartData.reduce((s, d) => s + d.value, 0)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <PieChart data={chartData} innerRadius={56} size={230}>
        {chartData.map((d, i) => (
          <PieSlice key={d.label} index={i} color={d.color} />
        ))}
        <PieCenter defaultLabel="Total" />
      </PieChart>
    </div>
  );
}

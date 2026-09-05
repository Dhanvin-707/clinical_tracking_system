"use client";

import BarChart from "../charts/bklit/bar-chart";
import Bar from "../charts/bklit/bar";
import { ChartTooltip } from "../charts/bklit/tooltip/chart-tooltip";

const ORDER = ["MILD", "MODERATE", "SEVERE"];

export function AesBySeverity({ data }: { data: Record<string, number> }) {
  const chartData = ORDER.map((key) => ({
    name: key,
    count: data[key] ?? 0,
  }));

  return (
    <BarChart
      data={chartData}
      xDataKey="name"
      aspectRatio="3 / 2"
      className="h-full w-full"
    >
      <Bar dataKey="count" fill="#fb7185" />
      <ChartTooltip />
    </BarChart>
  );
}

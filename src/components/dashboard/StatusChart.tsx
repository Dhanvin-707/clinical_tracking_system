"use client";

import BarChart from "../charts/bklit/bar-chart";
import Bar from "../charts/bklit/bar";
import { ChartTooltip } from "../charts/bklit/tooltip/chart-tooltip";

export function StatusChart({
  data,
  order,
}: {
  data: Record<string, number>;
  order: string[];
}) {
  const chartData = order.map((key) => ({
    name: key.replace("_", " "),
    count: data[key] ?? 0,
  }));

  return (
    <BarChart
      data={chartData}
      xDataKey="name"
      aspectRatio="3 / 2"
      className="h-full w-full"
    >
      <Bar dataKey="count" fill="#22d3ee" />
      <ChartTooltip />
    </BarChart>
  );
}

import { describe, expect, it } from "vitest";
import { entriesToCsv } from "@/lib/edc/export";

const fields = [
  { id: "f1", label: "Weight (kg)", type: "number" as const },
  { id: "f2", label: "Notes", type: "text" as const },
];

describe("EDC export", () => {
  it("builds CSV with header, labels, and escaped values", () => {
    const rows = [
      { data: { f1: 72, f2: "stable, but watch diet" } },
      { data: { f1: 81, f2: 'said "fine"' } },
    ];
    const csv = entriesToCsv(fields, rows as never);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Weight (kg),Notes");
    expect(lines[1]).toBe("72,\"stable, but watch diet\"");
    expect(lines[2]).toBe('81,"said ""fine"""');
  });

  it("handles empty data", () => {
    expect(entriesToCsv(fields, [] as never).trim()).toBe("Weight (kg),Notes");
  });
});

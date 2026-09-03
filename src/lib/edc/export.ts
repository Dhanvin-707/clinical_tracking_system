import type { EdcSchema } from "@/lib/edc/schema";

export interface ExportRow {
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export function entriesToCsv(schema: EdcSchema, rows: ExportRow[]): string {
  const header = schema.map((f) => f.label);
  const lines = [header.join(",")];

  for (const row of rows) {
    const cells = schema.map((f) => {
      const value = row.data?.[f.id];
      const text = value === null || value === undefined ? "" : String(value);
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    });
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

export function entriesToJson(schema: EdcSchema, rows: ExportRow[]): string {
  const labeled = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const f of schema) {
      out[f.label] = row.data?.[f.id] ?? null;
    }
    return out;
  });
  return JSON.stringify(labeled, null, 2);
}

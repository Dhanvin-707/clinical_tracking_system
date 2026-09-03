import { createSupabaseServer } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/rbac";
import { verifyAuditChain } from "@/lib/audit";
import { writeAudit } from "@/lib/audit";

export async function GET(request: Request) {
  await requireRole("Administrator", "QualityAssurance");
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  const supabase = await createSupabaseServer();

  const { data: entries } = await supabase
    .from("audit_log")
    .select("*")
    .order("id", { ascending: true });
  const chain = await verifyAuditChain();

  await writeAudit("COMPLIANCE_EXPORT", "audit", "chain", undefined, {
    format,
    entries: (entries ?? []).length,
    invalid: chain.invalid,
  });

  const rows = (entries ?? []) as {
    id: number;
    ts: string;
    action: string;
    module: string;
    entity: string;
    prev_hash: string;
    hash: string;
    before_data: unknown;
    after_data: unknown;
  }[];

  if (format === "json") {
    const payload = {
      exported_at: new Date().toISOString(),
      chain: { total: chain.total, invalid: chain.invalid },
      entries: rows,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="audit-trail.json"',
      },
    });
  }

  const header = "id,timestamp,action,module,entity,prev_hash,hash";
  const lines = rows.map((r) =>
    [
      r.id,
      r.ts,
      `"${String(r.action).replace(/"/g, '""')}"`,
      `"${String(r.module).replace(/"/g, '""')}"`,
      `"${String(r.entity).replace(/"/g, '""')}"`,
      r.prev_hash,
      r.hash,
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="audit-trail.csv"',
    },
  });
}

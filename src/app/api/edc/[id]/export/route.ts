import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/rbac";
import { writeAudit } from "@/lib/audit";
import { entriesToCsv, entriesToJson } from "@/lib/edc/export";
import type { EdcSchema } from "@/lib/edc/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireUser();
  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  const supabase = await createSupabaseServer();

  const { data: form } = await supabase
    .from("edc_forms")
    .select("name, schema_json")
    .eq("id", id)
    .single();
  if (!form) return new Response("Form not found", { status: 404 });

  const { data: entries } = await supabase
    .from("edc_entries")
    .select("data")
    .eq("form_id", id)
    .order("created_at", { ascending: true });

  const schema = form.schema_json as EdcSchema;
  const rows = (entries ?? []) as { data: Record<string, unknown> }[];

  await writeAudit("EDC_EXPORT", "edc", `form:${id}`, undefined, {
    format,
    rows: rows.length,
    by: profile.email,
  });

  const filename = `${(form.name as string).replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
  if (format === "json") {
    return new Response(entriesToJson(schema, rows), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  }

  return new Response(entriesToCsv(schema, rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import { validateEntry, type EdcSchema } from "@/lib/edc/schema";

export async function saveFormSchemaAction(formData: FormData) {
  await requireRole("Researcher", "PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();

  const protocolId = String(formData.get("protocol_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const schemaJson = String(formData.get("schema_json") ?? "");
  if (!protocolId || !name || !schemaJson) redirect(`/edc?error=missing`);

  let schema: EdcSchema;
  try {
    schema = JSON.parse(schemaJson);
    if (!Array.isArray(schema) || schema.some((f) => !f.id || !f.label || !f.type)) {
      throw new Error("bad schema");
    }
  } catch {
    redirect(`/edc?error=schema`);
  }

  const { data: existing } = await supabase
    .from("edc_forms")
    .select("version")
    .eq("protocol_id", protocolId)
    .eq("name", name)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = ((existing?.[0]?.version as number) ?? 0) + 1;

  const { data: form, error } = await supabase
    .from("edc_forms")
    .insert({
      protocol_id: protocolId,
      name,
      version: nextVersion,
      schema_json: schema,
    })
    .select()
    .single();
  if (error) redirect(`/edc?error=save&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("EDC_FORM_SAVE", "edc", `form:${form.id}`, undefined, {
    name,
    version: nextVersion,
    fields: schema.length,
  });
  revalidatePath("/edc");
  redirect(`/edc?saved=1&form=${form.id}`);
}

export async function submitEntryAction(formData: FormData) {
  await requireRole("Researcher", "LabTechnician", "Administrator");
  const supabase = await createSupabaseServer();

  const formId = String(formData.get("form_id") ?? "");
  const patientId = String(formData.get("patient_id") ?? "");
  const dataJson = String(formData.get("data_json") ?? "");
  if (!formId || !patientId || !dataJson) redirect(`/edc/${formId}?error=missing`);

  const { data: form } = await supabase
    .from("edc_forms")
    .select("schema_json")
    .eq("id", formId)
    .single();
  if (!form) redirect(`/edc?error=form`);

  const schema = form.schema_json as EdcSchema;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(dataJson);
  } catch {
    redirect(`/edc/${formId}?error=data`);
  }

  // Server-side enforcement of the shared validation engine.
  const errors = validateEntry(schema, data);
  if (errors.length > 0) {
    redirect(`/edc/${formId}?error=validation&msg=${encodeURIComponent(errors[0].message)}`);
  }

  const { data: entry, error } = await supabase
    .from("edc_entries")
    .insert({ form_id: formId, patient_id: patientId, data })
    .select()
    .single();
  if (error) redirect(`/edc/${formId}?error=save&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("EDC_ENTRY_SUBMIT", "edc", `entry:${entry.id}`, undefined, {
    form_id: formId,
    patient_id: patientId,
  });
  revalidatePath(`/edc/${formId}`);
  redirect(`/edc/${formId}?submitted=1`);
}

export async function changeEntryStatusAction(formData: FormData) {
  await requireRole("DataManager", "Administrator");
  const supabase = await createSupabaseServer();

  const entryId = String(formData.get("entry_id") ?? "");
  const to = String(formData.get("to") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!entryId || !["QUERY", "CLEANED", "LOCKED"].includes(to)) {
    redirect("/edc?error=missing");
  }

  const { error } = await supabase.rpc("change_entry_status", {
    p_entry_id: entryId,
    p_to: to,
    p_note: note || null,
  });
  if (error) redirect(`/edc?error=entry&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("EDC_ENTRY_STATUS", "edc", `entry:${entryId}`, undefined, { to });
  revalidatePath("/edc");
  redirect("/edc?transitioned=1");
}

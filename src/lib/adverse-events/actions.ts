"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isSeriousAdverseEvent, type AeCausality, type AeSeverity } from "@/lib/adverse-events/rules";

export async function reportAdverseEventAction(formData: FormData) {
  await requireRole("Researcher", "DataManager", "PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();

  const patientId = String(formData.get("patient_id") ?? "");
  const protocolId = String(formData.get("protocol_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const severity = String(formData.get("severity") ?? "") as AeSeverity;
  const causality = String(formData.get("causality") ?? "") as AeCausality;
  const outcome = String(formData.get("outcome") ?? "").trim();

  if (
    !patientId || !protocolId || !description || !occurredOn ||
    !["MILD", "MODERATE", "SEVERE"].includes(severity) ||
    !["UNRELATED", "POSSIBLE", "PROBABLE", "DEFINITE"].includes(causality)
  ) {
    redirect("/adverse-events?error=missing");
  }

  const { data: aeId, error } = await supabase.rpc("report_adverse_event", {
    p_patient_id: patientId,
    p_protocol_id: protocolId,
    p_description: description,
    p_occurred_on: occurredOn,
    p_severity: severity,
    p_causality: causality,
    p_outcome: outcome,
  });
  if (error) redirect(`/adverse-events?error=save&msg=${encodeURIComponent(error.message)}`);

  const sae = isSeriousAdverseEvent(severity);
  await writeAudit("AE_REPORT", "adverse-events", `ae:${aeId}`, undefined, {
    sae,
    severity,
    causality,
  });
  revalidatePath("/adverse-events");
  redirect(`/adverse-events?reported=1&sae=${sae ? "1" : "0"}`);
}

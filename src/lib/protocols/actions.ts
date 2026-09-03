"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { ProtocolStatus } from "@/lib/protocols/workflow";

export async function createProtocolAction(formData: FormData) {
  await requireRole("Researcher", "PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();

  const title = String(formData.get("title") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim();
  const methodology = String(formData.get("methodology") ?? "").trim();
  const inclusion = String(formData.get("inclusion_criteria") ?? "").trim();
  const exclusion = String(formData.get("exclusion_criteria") ?? "").trim();

  if (!title) redirect("/protocols?error=missing");

  const { data: protocol, error } = await supabase
    .from("protocols")
    .insert({
      title,
      objective,
      methodology,
      inclusion_criteria: inclusion,
      exclusion_criteria: exclusion,
    })
    .select()
    .single();
  if (error) redirect(`/protocols?error=create&msg=${encodeURIComponent(error.message)}`);

  await supabase.from("protocol_versions").insert({
    protocol_id: protocol.id,
    version: 1,
    title,
    objective,
    methodology,
    inclusion_criteria: inclusion,
    exclusion_criteria: exclusion,
  });

  await writeAudit("PROTOCOL_CREATE", "protocols", `protocol:${protocol.id}`, undefined, {
    title,
  });
  revalidatePath("/protocols");
  redirect(`/protocols/${protocol.id}`);
}

export async function editProtocolAction(formData: FormData) {
  await requireRole("PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();

  const protocolId = String(formData.get("protocol_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim();
  const methodology = String(formData.get("methodology") ?? "").trim();
  const inclusion = String(formData.get("inclusion_criteria") ?? "").trim();
  const exclusion = String(formData.get("exclusion_criteria") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!protocolId || !title) redirect(`/protocols/${protocolId}?error=missing`);

  const { error } = await supabase.rpc("edit_protocol", {
    p_protocol_id: protocolId,
    p_title: title,
    p_objective: objective,
    p_methodology: methodology,
    p_inclusion: inclusion,
    p_exclusion: exclusion,
    p_reason: reason,
  });
  if (error) redirect(`/protocols/${protocolId}?error=edit&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("PROTOCOL_EDIT", "protocols", `protocol:${protocolId}`, undefined, {
    title,
  });
  revalidatePath(`/protocols/${protocolId}`);
  redirect(`/protocols/${protocolId}?edited=1`);
}

export async function changeStatusAction(formData: FormData) {
  await requireRole("Researcher", "PrincipalInvestigator", "RegulatoryAffairs", "Administrator");
  const supabase = await createSupabaseServer();

  const protocolId = String(formData.get("protocol_id") ?? "");
  const to = String(formData.get("to") ?? "") as ProtocolStatus;
  if (!protocolId || !to) redirect(`/protocols/${protocolId}?error=missing`);

  const { error } = await supabase.rpc("change_protocol_status", {
    p_protocol_id: protocolId,
    p_to: to,
  });
  if (error) redirect(`/protocols/${protocolId}?error=transition&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("PROTOCOL_STATUS", "protocols", `protocol:${protocolId}`, undefined, {
    status: to,
  });
  revalidatePath(`/protocols/${protocolId}`);
  redirect(`/protocols/${protocolId}?transitioned=1`);
}

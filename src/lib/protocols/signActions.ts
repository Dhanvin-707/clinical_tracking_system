"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  computeSignatureHash,
  isReAuthValid,
  type DeviationSeverity,
} from "@/lib/protocols/signatures";

export async function signProtocolAction(formData: FormData) {
  await requireRole("PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();

  const protocolId = String(formData.get("protocol_id") ?? "");
  const action = String(formData.get("action") ?? "") as "APPROVE" | "REJECT";
  const reason = String(formData.get("reason") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!protocolId || !password || (action !== "APPROVE" && action !== "REJECT")) {
    redirect(`/protocols/${protocolId}?error=signmissing`);
  }

  // Re-authenticate the signer with their password.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect(`/protocols/${protocolId}?error=signauth`);

  const { error: reAuthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (reAuthError) redirect(`/protocols/${protocolId}?error=signauth`);

  const reAuthAt = new Date();
  if (!isReAuthValid(reAuthAt)) redirect(`/protocols/${protocolId}?error=signauth`);

  const signatureHash = computeSignatureHash(user.id, action, reason, reAuthAt);

  const { error } = await supabase.rpc("sign_protocol", {
    p_protocol_id: protocolId,
    p_action: action,
    p_reason: reason,
    p_signature_hash: signatureHash,
  });
  if (error) redirect(`/protocols/${protocolId}?error=sign&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("PROTOCOL_SIGNED", "protocols", `protocol:${protocolId}`, undefined, {
    action,
    reason,
  });
  revalidatePath(`/protocols/${protocolId}`);
  redirect(`/protocols/${protocolId}?signed=1`);
}

export async function logDeviationAction(formData: FormData) {
  await requireRole(
    "Researcher",
    "DataManager",
    "PrincipalInvestigator",
    "RegulatoryAffairs",
    "Administrator"
  );
  const supabase = await createSupabaseServer();

  const protocolId = String(formData.get("protocol_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "") as DeviationSeverity;
  if (!protocolId || !description || !["MINOR", "MAJOR", "CRITICAL"].includes(severity)) {
    redirect(`/protocols/${protocolId}?error=devmissing`);
  }

  const { error } = await supabase.rpc("log_deviation", {
    p_protocol_id: protocolId,
    p_description: description,
    p_severity: severity,
  });
  if (error) redirect(`/protocols/${protocolId}?error=dev&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("DEVIATION_LOG", "protocols", `protocol:${protocolId}`, undefined, {
    severity,
    description,
  });
  revalidatePath(`/protocols/${protocolId}`);
  redirect(`/protocols/${protocolId}?deviation=1`);
}

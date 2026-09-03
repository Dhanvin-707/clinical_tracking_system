"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";
import { canTransition, hashFile } from "@/lib/patients/enrollment";
import { createSupabaseServer } from "@/lib/supabase/server";

const CLINICAL_ROLES = ["Researcher", "DataManager", "Administrator"] as const;

export async function registerPatientAction(formData: FormData) {
  await requireRole(...CLINICAL_ROLES);
  const supabase = await createSupabaseServer();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const dob = String(formData.get("dob") ?? "");
  const gender = String(formData.get("gender") ?? "");
  const historyText = String(formData.get("medical_history") ?? "").trim();

  if (!fullName || !dob || !gender) redirect("/patients?error=missing");

  const { data: autoId } = await supabase.rpc("next_patient_id");
  const autoIdText = (autoId as string | null) ?? null;

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      auto_id: autoIdText,
      full_name: fullName,
      dob,
      gender,
      medical_history: { notes: historyText },
    })
    .select()
    .single();
  if (error) redirect(`/patients?error=create&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("PATIENT_REGISTER", "patients", `patient:${patient.id}`, undefined, {
    auto_id: patient.auto_id,
    full_name: patient.full_name,
  });
  revalidatePath("/patients");
  redirect(`/patients/${patient.id}?created=1`);
}

export async function changeEnrollmentAction(formData: FormData) {
  await requireRole(...CLINICAL_ROLES);
  const supabase = await createSupabaseServer();

  const patientId = String(formData.get("patient_id") ?? "");
  const to = String(formData.get("to") ?? "") as
    | "ENROLLED"
    | "WITHDRAWN";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!patientId || (to !== "ENROLLED" && to !== "WITHDRAWN")) {
    redirect(`/patients/${patientId}?error=missing`);
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("enrollment_status")
    .eq("id", patientId)
    .single();

  if (!patient || !canTransition(patient.enrollment_status, to)) {
    redirect(`/patients/${patientId}?error=transition`);
  }

  const { error } = await supabase.rpc(
    to === "ENROLLED" ? "enroll_patient" : "withdraw_patient",
    to === "ENROLLED" ? { p_patient_id: patientId } : { p_patient_id: patientId, p_reason: reason }
  );
  if (error) redirect(`/patients/${patientId}?error=transition&msg=${encodeURIComponent(error.message)}`);

  await writeAudit(
    to === "ENROLLED" ? "PATIENT_ENROLL" : "PATIENT_WITHDRAW",
    "patients",
    `patient:${patientId}`,
    { from: patient.enrollment_status },
    { to, reason: reason || undefined }
  );
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}?transitioned=1`);
}

export async function uploadConsentAction(formData: FormData) {
  await requireRole(...CLINICAL_ROLES);
  const supabase = await createSupabaseServer();

  const patientId = String(formData.get("patient_id") ?? "");
  const file = formData.get("file");
  if (!patientId || !(file instanceof File) || file.size === 0) {
    redirect(`/patients/${patientId}?error=upload`);
  }

  const hash = await hashFile(file);
  const path = `consents/${patientId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("consent-pdfs")
    .upload(path, file);
  if (uploadError) {
    redirect(`/patients/${patientId}?error=upload&msg=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: consent, error } = await supabase
    .from("consents")
    .insert({ patient_id: patientId, file_path: path, sha256_hash: hash })
    .select()
    .single();
  if (error) {
    redirect(`/patients/${patientId}?error=upload&msg=${encodeURIComponent(error.message)}`);
  }

  await writeAudit("CONSENT_UPLOAD", "patients", `consent:${consent.id}`, undefined, {
    patient_id: patientId,
    sha256_hash: hash,
  });
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}?consented=1`);
}

export async function verifyConsentAction(formData: FormData) {
  await requireRole(...CLINICAL_ROLES);
  const supabase = await createSupabaseServer();

  const patientId = String(formData.get("patient_id") ?? "");
  const consentId = String(formData.get("consent_id") ?? "");
  const file = formData.get("file");
  if (!patientId || !consentId || !(file instanceof File) || file.size === 0) {
    redirect(`/patients/${patientId}?error=verify`);
  }

  const { data: consent } = await supabase
    .from("consents")
    .select("sha256_hash")
    .eq("id", consentId)
    .single();

  const hash = await hashFile(file);
  const ok = consent && consent.sha256_hash === hash;

  if (ok) {
    const { error } = await supabase
      .from("consents")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", consentId);
    if (error) redirect(`/patients/${patientId}?error=verify&msg=${encodeURIComponent(error.message)}`);
  }

  await writeAudit(
    ok ? "CONSENT_VERIFY_OK" : "CONSENT_VERIFY_FAIL",
    "patients",
    `consent:${consentId}`,
    { expected: consent?.sha256_hash },
    { provided: hash }
  );
  revalidatePath(`/patients/${patientId}`);
  redirect(`/patients/${patientId}?verify=${ok ? "ok" : "fail"}`);
}

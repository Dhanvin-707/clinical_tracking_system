/* eslint-disable no-console */
// Seed demo BUSINESS data (patients, consents, protocols, EDC, adverse events)
// so the dashboard and module pages show populated records. Idempotent: refuses
// to run if patients already exist.
// Usage: npm run seed:data   (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const U = { admin: "", researcher: "", dm: "", pi: "", ra: "", lab: "", qa: "" };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { count, error: countErr } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true });
  if (countErr) throw new Error(`count patients failed: ${countErr.message}`);
  if ((count ?? 0) > 0) {
    console.log("Patients already present — skipping (run npm run reset:data to reseed).");
    return;
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id,email");
  if (profErr) throw new Error(`load profiles failed: ${profErr.message}`);
  const byEmail: Record<string, string> = {};
  for (const p of profiles ?? []) byEmail[p.email] = p.id;
  for (const k of Object.keys(U)) U[k] = byEmail[`${k}@demo.test`] ?? "";
  if (Object.values(U).some((v) => !v)) {
    throw new Error("Not all demo users found — run npm run seed:demo first.");
  }

  const now = new Date();
  const daysAgo = (n: number) =>
    new Date(now.getTime() - n * 86400000).toISOString();

  // ---- Patients -----------------------------------------------------------
  const patientRows = [
    { full_name: "Alice Martins", dob: "1984-03-12", gender: "F", medical_history: { hypertension: true, smoker: false }, enrollment_status: "ENROLLED", enrolled_at: daysAgo(60), created_by: U.researcher },
    { full_name: "Bruno Costa", dob: "1972-07-01", gender: "M", medical_history: { diabetes: true }, enrollment_status: "ENROLLED", enrolled_at: daysAgo(52), created_by: U.researcher },
    { full_name: "Clara Nunes", dob: "1990-01-22", gender: "F", medical_history: { asthma: true }, enrollment_status: "SCREENING", created_by: U.dm },
    { full_name: "Diego Ferreira", dob: "1965-11-09", gender: "M", medical_history: { hypertension: true, smoker: true }, enrollment_status: "ENROLLED", enrolled_at: daysAgo(35), created_by: U.researcher },
    { full_name: "Elena Rocha", dob: "1995-05-30", gender: "F", medical_history: {}, enrollment_status: "WITHDRAWN", enrolled_at: daysAgo(40), withdrawn_at: daysAgo(10), withdrawal_reason: "Enrollment criteria not met", created_by: U.researcher },
    { full_name: "Felipe Souza", dob: "1979-12-18", gender: "M", medical_history: { hyperlipidemia: true }, enrollment_status: "SCREENING", created_by: U.dm },
    { full_name: "Gabriela Lima", dob: "1988-08-07", gender: "F", medical_history: {}, enrollment_status: "ENROLLED", enrolled_at: daysAgo(20), created_by: U.researcher },
    { full_name: "Hugo Alves", dob: "1958-02-14", gender: "M", medical_history: { hypertension: true, diabetes: true }, enrollment_status: "ENROLLED", enrolled_at: daysAgo(15), created_by: U.researcher },
  ];
  const patientIds: string[] = [];
  for (const r of patientRows) {
    const { data: autoId, error: rpcErr } = await supabase.rpc("next_patient_id");
    if (rpcErr) throw new Error(`next_patient_id: ${rpcErr.message}`);
    const { data, error } = await supabase.from("patients").insert({ ...r, auto_id: autoId }).select("id").single();
    if (error) throw new Error(`insert patient ${r.full_name}: ${error.message}`);
    patientIds.push(data!.id);
  }
  console.log(`+ ${patientIds.length} patients`);

  // ---- Consents -----------------------------------------------------------
  const consentFiles = [
    "consent-pdfs/alice-martins-v2.pdf",
    "consent-pdfs/bruno-costa-v1.pdf",
    "consent-pdfs/diego-ferreira-v1.pdf",
    "consent-pdfs/gabriela-lima-v2.pdf",
  ];
  for (const [i, path] of consentFiles.entries()) {
    const { error } = await supabase.from("consents").insert({
      patient_id: patientIds[i],
      file_path: path,
      sha256_hash: require("node:crypto").createHash("sha256").update(path).digest("hex"),
      consented_at: daysAgo(50 - i * 10),
      verified_at: daysAgo(48 - i * 10),
      created_by: U.pi,
    });
    if (error) throw new Error(`insert consent: ${error.message}`);
  }
  console.log(`+ consents`);

  // ---- Protocols + versions ----------------------------------------------
  const protocolSeed = [
    { title: "Phase II — Diabetes Glycemic Control Trial", status: "ACTIVE", objective: "Evaluate efficacy of DX-442 vs placebo.", methodology: "Randomized, double-blind, parallel arm.", inclusion_criteria: "Adults 40-70 with HbA1c > 7.5%.", exclusion_criteria: "Type 1 diabetes, renal disease.", created_by: U.pi },
    { title: "Observational — Cardiovascular Risk Cohort", status: "APPROVED", objective: "Track 5-year MACE outcomes.", methodology: "Prospective cohort, 1200 subjects.", inclusion_criteria: "Adults 30-75 without prior CVD.", exclusion_criteria: "Active malignancy.", created_by: U.researcher },
    { title: "Early Feasibility — Oncology Biomarker Study", status: "DRAFT", objective: "Validate ctDNA assay sensitivity.", methodology: "Single-arm pilot, 40 subjects.", inclusion_criteria: "Stage III-IV solid tumors.", exclusion_criteria: "Prior immunotherapy.", created_by: U.researcher },
  ];
  const protocolIds: string[] = [];
  for (const p of protocolSeed) {
    const { data, error } = await supabase.from("protocols").insert({ ...p, current_version: 2 }).select("id").single();
    if (error) throw new Error(`insert protocol ${p.title}: ${error.message}`);
    protocolIds.push(data!.id);
    const { error: verr } = await supabase.from("protocol_versions").insert([
      { protocol_id: data!.id, version: 1, title: p.title, objective: p.objective, methodology: p.methodology, inclusion_criteria: p.inclusion_criteria, exclusion_criteria: p.exclusion_criteria, reason: "Initial", created_by: p.created_by },
      { protocol_id: data!.id, version: 2, title: p.title, objective: p.objective, methodology: p.methodology, inclusion_criteria: p.inclusion_criteria, exclusion_criteria: p.exclusion_criteria, reason: "Safety update", created_by: p.created_by },
    ]);
    if (verr) throw new Error(`insert versions for ${p.title}: ${verr.message}`);
  }
  console.log(`+ ${protocolIds.length} protocols (2 versions each)`);

  // ---- Signatures + deviations ---------------------------------------------
  const { error: sigErr } = await supabase.from("signatures").insert({
    protocol_id: protocolIds[0], user_id: U.pi, action: "APPROVE", reason: "Safety review complete",
    sha256_hash: require("node:crypto").createHash("sha256").update("APPROVE-safety").digest("hex"),
    re_auth_ts: daysAgo(20),
  });
  if (sigErr) throw new Error(`insert signature: ${sigErr.message}`);
  for (const [seq, d] of [
    { protocol_id: protocolIds[0], description: "Visit window missed by 5 days", severity: "MINOR", created_by: U.researcher },
    { protocol_id: protocolIds[0], description: "Incomplete lab panel at week 8", severity: "MAJOR", escalated_at: daysAgo(6), created_by: U.dm },
  ].entries()) {
    const { error } = await supabase.from("deviations").insert(d);
    if (error) throw new Error(`insert deviation ${seq}: ${error.message}`);
  }
  console.log("+ signature + deviations");

  // ---- EDC forms + entries ---------------------------------------------------
  const { data: form, error: formErr } = await supabase.from("edc_forms").insert({
    protocol_id: protocolIds[0], name: "Baseline Visit v2",
    schema_json: [{ key: "hbA1c", type: "number" }, { key: "fpg", type: "number" }, { key: "weight_kg", type: "number" }],
    version: 2, created_by: U.researcher,
  }).select("id").single();
  if (formErr) throw new Error(`insert edc_form: ${formErr.message}`);
  const entryData = [
    { patient_id: patientIds[0], data: { hbA1c: 8.2, fpg: 7.9, weight_kg: 74.2 }, status: "CLEANED", created_by: U.lab },
    { patient_id: patientIds[1], data: { hbA1c: 8.9, fpg: 8.4, weight_kg: 91.5 }, status: "CLEANED", created_by: U.lab },
    { patient_id: patientIds[3], data: { hbA1c: 7.8, fpg: 7.2, weight_kg: 88.0 }, status: "QUERY", query_note: "Confirm baseline timing", created_by: U.lab },
  ];
  for (const e of entryData) {
    const { error } = await supabase.from("edc_entries").insert({ form_id: form!.id, ...e });
    if (error) throw new Error(`insert edc_entry: ${error.message}`);
  }
  console.log(`+ edc_form + ${entryData.length} entries`);

  // ---- Adverse events ---------------------------------------------------------
  for (const [seq, ae] of [
    { patient_id: patientIds[0], protocol_id: protocolIds[0], description: "Mild headache", occurred_on: "2026-06-10", severity: "MILD", causality: "POSSIBLE", outcome: "Resolved", created_by: U.researcher },
    { patient_id: patientIds[3], protocol_id: protocolIds[0], description: "Constipation", occurred_on: "2026-06-22", severity: "MODERATE", causality: "PROBABLE", outcome: "Resolving", created_by: U.researcher },
    { patient_id: patientIds[1], protocol_id: protocolIds[0], description: "Grade 3 hypoglycemia", occurred_on: "2026-07-02", severity: "SEVERE", causality: "DEFINITE", outcome: "Hospitalized", is_sae: true, ethics_notified_at: daysAgo(3), created_by: U.pi },
  ].entries()) {
    const { error } = await supabase.from("adverse_events").insert(ae);
    if (error) throw new Error(`insert AE ${seq}: ${error.message}`);
  }
  console.log("+ adverse events (incl. 1 SAE)");

  // ---- Notifications ----------------------------------------------------------
  const { data: raProfile } = await supabase.from("profiles").select("id").eq("role", "RegulatoryAffairs").single();
  if (raProfile) {
    await supabase.from("notifications").insert([
      { user_id: raProfile.id, type: "SAE_REPORT", payload: { ae_id: "grade3-hypo", deadline_hours: 24 }, read_at: null },
      { user_id: U.researcher, type: "PROTOCOL_UPDATE", payload: { protocol: "DX-442" }, read_at: null },
    ]);
  }
  console.log("+ notifications");

  console.log("\nDone. Demo business data seeded. Login and open the dashboard.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
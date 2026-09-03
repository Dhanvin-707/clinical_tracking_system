/* eslint-disable no-console */
// Seed demo accounts for every role using the Supabase Auth Admin API.
// Usage: npm run seed:demo   (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PASSWORD = "demo12345";

const DEMO_USERS = [
  { email: "admin@demo.test", full_name: "Admin Demo", role: "Administrator" },
  { email: "researcher@demo.test", full_name: "Researcher Demo", role: "Researcher" },
  { email: "dm@demo.test", full_name: "Data Manager Demo", role: "DataManager" },
  { email: "pi@demo.test", full_name: "PI Demo", role: "PrincipalInvestigator" },
  { email: "ra@demo.test", full_name: "Regulatory Demo", role: "RegulatoryAffairs" },
  { email: "lab@demo.test", full_name: "Lab Tech Demo", role: "LabTechnician" },
  { email: "qa@demo.test", full_name: "QA Demo", role: "QualityAssurance" },
] as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

async function promoteRole(supabase: SupabaseClient, email: string, role: string) {
  const { error } = await supabase.rpc("promote_user", { p_email: email, p_role: role });
  if (error) {
    throw new Error(`promote_user(${email}, ${role}) failed: ${error.message}`);
  }
}

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  for (const u of DEMO_USERS) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", u.email)
      .maybeSingle();

    if (existing) {
      console.log(`= ${u.email}: exists, promoting to ${u.role}`);
      await promoteRole(supabase, u.email, u.role);
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    if (error) {
      console.error(`! ${u.email}: ${error.message}`);
      continue;
    }
    await promoteRole(supabase, u.email, u.role);
    console.log(`+ ${u.email} / ${PASSWORD} -> ${u.role}`);
  }

  console.log("\nDone. Log in with any email above, password: " + PASSWORD);
  console.log("2FA demo code: 482913");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
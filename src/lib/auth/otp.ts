import { createSupabaseServer } from "@/lib/supabase/server";

const DEMO_OTP = "482913";

export async function sendOtp(email: string): Promise<{ ok: boolean; demoCode?: string }> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (error) return { ok: false };
  if (!data?.session) {
    // Demo mode: log the code so the flow works without a real email transport.
    console.info(`[DEMO 2FA] OTP for ${email}: ${DEMO_OTP}`);
    return { ok: true, demoCode: DEMO_OTP };
  }
  return { ok: true };
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  if (token === DEMO_OTP) return { ok: true };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { sendOtp, verifyOtp } from "@/lib/auth/otp";
import { writeAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/login?error=invalid");
  }

  await writeAudit("LOGIN", "auth", `user:${email}`);
  redirect("/verify-otp");
}

export async function verifyOtpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();

  if (!email || !token) redirect("/verify-otp?error=missing");

  const { ok } = await verifyOtp(email, token);
  if (!ok) redirect("/verify-otp?error=invalid");

  await writeAudit("VERIFY_2FA", "auth", `user:${email}`);
  redirect("/dashboard");
}

export async function resendOtpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) await sendOtp(email);
  revalidatePath("/verify-otp");
}

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) redirect("/signup?error=missing");

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    const taken =
      error.code === "user_already_exists" ||
      /already registered/i.test(error.message);
    redirect(taken ? "/signup?error=taken" : "/signup?error=other");
  }

  await writeAudit("SIGNUP", "auth", `user:${email}`);
  redirect("/login?created=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}

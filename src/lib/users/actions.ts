"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeAudit } from "@/lib/audit";
import { requireRole, ROLES, type UserRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function createUserAction(formData: FormData) {
  await requireRole("Administrator");
  const supabase = await createSupabaseServer();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!email || !password || !fullName || !ROLES.includes(role)) {
    redirect("/users?error=missing");
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) redirect(`/users?error=create&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("USER_CREATE", "users", `user:${email}`, undefined, { role });
  revalidatePath("/users");
  redirect("/users?created=1");
}

export async function setUserRoleAction(formData: FormData) {
  await requireRole("Administrator");
  const supabase = await createSupabaseServer();

  const profileId = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;
  if (!profileId || !ROLES.includes(role)) redirect("/users?error=missing");

  const { data: before } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profileId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) redirect(`/users?error=update&msg=${encodeURIComponent(error.message)}`);

  await writeAudit("USER_ROLE_CHANGE", "users", `profile:${profileId}`, before ?? undefined, { role });
  revalidatePath("/users");
}

export async function setUserActiveAction(formData: FormData) {
  await requireRole("Administrator");
  const supabase = await createSupabaseServer();

  const profileId = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  if (!profileId) redirect("/users?error=missing");

  const { data: before } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", profileId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) redirect(`/users?error=update&msg=${encodeURIComponent(error.message)}`);

  await writeAudit(
    isActive ? "USER_ENABLE" : "USER_DISABLE",
    "users",
    `profile:${profileId}`,
    before ?? undefined,
    { is_active: isActive }
  );
  revalidatePath("/users");
}

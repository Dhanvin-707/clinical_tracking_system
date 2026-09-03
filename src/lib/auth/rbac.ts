import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const ROLES = [
  "Researcher",
  "DataManager",
  "PrincipalInvestigator",
  "RegulatoryAffairs",
  "Administrator",
  "LabTechnician",
  "QualityAssurance",
] as const;

export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  Researcher: "Researcher",
  DataManager: "Data Manager",
  PrincipalInvestigator: "Principal Investigator",
  RegulatoryAffairs: "Regulatory Affairs",
  Administrator: "Administrator",
  LabTechnician: "Lab Technician",
  QualityAssurance: "Quality Assurance",
};

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data as Profile | null;
}

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await requireUser();
  if (!profile.is_active) redirect("/login?error=disabled");
  if (!roles.includes(profile.role)) redirect("/dashboard");
  return profile;
}

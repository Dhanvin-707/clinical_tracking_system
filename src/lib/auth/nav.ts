import type { UserRole } from "@/lib/auth/rbac";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: Record<UserRole, NavItem[]> = {
  Administrator: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/users" },
    { label: "Audit trail", href: "/audit" },
  ],
  Researcher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Patients", href: "/patients" },
    { label: "EDC", href: "/edc" },
  ],
  DataManager: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "EDC review", href: "/edc" },
    { label: "Patients", href: "/patients" },
  ],
  PrincipalInvestigator: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Protocols", href: "/protocols" },
    { label: "Patients", href: "/patients" },
  ],
  RegulatoryAffairs: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Adverse events", href: "/adverse-events" },
    { label: "Protocols", href: "/protocols" },
  ],
  LabTechnician: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "EDC", href: "/edc" },
  ],
  QualityAssurance: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Audit trail", href: "/audit" },
    { label: "Protocols", href: "/protocols" },
  ],
};

import { describe, expect, it } from "vitest";
import { NAV } from "@/lib/auth/nav";
import { ROLES, ROLE_LABELS, type UserRole } from "@/lib/auth/rbac";

describe("RBAC roles", () => {
  it("defines exactly the seven trial roles", () => {
    expect(ROLES).toHaveLength(7);
    expect(ROLES).toEqual([
      "Researcher",
      "DataManager",
      "PrincipalInvestigator",
      "RegulatoryAffairs",
      "Administrator",
      "LabTechnician",
      "QualityAssurance",
    ]);
  });

  it("has a human label for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_LABELS[role as UserRole]).toBeTruthy();
    }
  });
});

describe("Role-scoped navigation", () => {
  it("gives every role a dashboard entry", () => {
    for (const role of ROLES) {
      expect(NAV[role][0]).toEqual({ label: "Dashboard", href: "/dashboard" });
    }
  });

  it("gives only the Administrator access to user management", () => {
    expect(NAV.Administrator.map((i) => i.href)).toContain("/users");
    for (const role of ROLES.filter((r) => r !== "Administrator")) {
      expect(NAV[role].map((i) => i.href)).not.toContain("/users");
    }
  });

  it("gives only QA and Admin access to the audit trail", () => {
    const allowed = new Set(["Administrator", "QualityAssurance"]);
    for (const role of ROLES) {
      const hasAudit = NAV[role].map((i) => i.href).includes("/audit");
      expect(hasAudit).toBe(allowed.has(role));
    }
  });

  it("gives Regulatory Affairs the adverse-events entry", () => {
    expect(NAV.RegulatoryAffairs.map((i) => i.href)).toContain("/adverse-events");
  });
});

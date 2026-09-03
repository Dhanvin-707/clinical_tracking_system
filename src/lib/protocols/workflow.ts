export type ProtocolStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "CLOSED";

export const PROTOCOL_STATUSES: ProtocolStatus[] = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
  "CLOSED",
];

export const PROTOCOL_STATUS_LABELS: Record<ProtocolStatus, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export function canTransitionStatus(
  from: ProtocolStatus,
  to: ProtocolStatus,
  role: string
): boolean {
  switch (from) {
    case "DRAFT":
      return (
        to === "UNDER_REVIEW" &&
        ["Researcher", "PrincipalInvestigator", "Administrator"].includes(role)
      );
    case "UNDER_REVIEW":
      if (to === "DRAFT")
        return ["PrincipalInvestigator", "Administrator"].includes(role);
      if (to === "APPROVED")
        return ["PrincipalInvestigator", "Administrator"].includes(role);
      return false;
    case "APPROVED":
      return (
        to === "ACTIVE" &&
        ["PrincipalInvestigator", "Administrator"].includes(role)
      );
    case "ACTIVE":
      return (
        to === "CLOSED" &&
        ["RegulatoryAffairs", "Administrator"].includes(role)
      );
    default:
      return false;
  }
}

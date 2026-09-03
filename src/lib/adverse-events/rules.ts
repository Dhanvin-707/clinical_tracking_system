export type AeSeverity = "MILD" | "MODERATE" | "SEVERE";
export type AeCausality = "UNRELATED" | "POSSIBLE" | "PROBABLE" | "DEFINITE";

export const AE_SEVERITIES: AeSeverity[] = ["MILD", "MODERATE", "SEVERE"];
export const AE_CAUSALITIES: AeCausality[] = ["UNRELATED", "POSSIBLE", "PROBABLE", "DEFINITE"];

export const AE_SEVERITY_LABELS: Record<AeSeverity, string> = {
  MILD: "Mild",
  MODERATE: "Moderate",
  SEVERE: "Severe",
};

export const AE_CAUSALITY_LABELS: Record<AeCausality, string> = {
  UNRELATED: "Unrelated",
  POSSIBLE: "Possible",
  PROBABLE: "Probable",
  DEFINITE: "Definite",
};

export function isSeriousAdverseEvent(severity: AeSeverity): boolean {
  return severity === "SEVERE";
}

export const SAE_NOTIFY_HOURS = 24;

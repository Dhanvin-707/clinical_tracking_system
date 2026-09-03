import { createHash } from "node:crypto";

export const RE_AUTH_WINDOW_MS = 5 * 60 * 1000;

export type SignatureAction = "APPROVE" | "REJECT";

export type DeviationSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export const DEVIATION_LABELS: Record<DeviationSeverity, string> = {
  MINOR: "Minor",
  MAJOR: "Major",
  CRITICAL: "Critical",
};

export function computeSignatureHash(
  userId: string,
  action: SignatureAction,
  reason: string,
  reAuthAt: Date
): string {
  return createHash("sha256")
    .update(`${userId}|${action}|${reason}|${reAuthAt.toISOString()}`)
    .digest("hex");
}

export function isReAuthValid(reAuthAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - reAuthAt.getTime() <= RE_AUTH_WINDOW_MS;
}

export function escalatesToRA(severity: DeviationSeverity): boolean {
  return severity === "CRITICAL";
}

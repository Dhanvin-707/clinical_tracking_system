import { createHash } from "node:crypto";

export async function hashFile(file: File | Buffer): Promise<string> {
  const data = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  return createHash("sha256").update(data).digest("hex");
}

export function verifyFileHash(file: File | Buffer, expected: string): Promise<boolean> {
  return hashFile(file).then((h) => h === expected);
}

export type EnrollmentStatus = "SCREENING" | "ENROLLED" | "WITHDRAWN";

export const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  SCREENING: "Screening",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
};

export function canTransition(
  from: EnrollmentStatus,
  to: EnrollmentStatus
): boolean {
  switch (from) {
    case "SCREENING":
      return to === "ENROLLED" || to === "WITHDRAWN";
    case "ENROLLED":
      return to === "WITHDRAWN";
    case "WITHDRAWN":
      return false;
  }
}

import { describe, expect, it } from "vitest";
import {
  canTransition,
  hashFile,
  verifyFileHash,
  type EnrollmentStatus,
} from "@/lib/patients/enrollment";

describe("Enrollment state machine", () => {
  const cases: [EnrollmentStatus, EnrollmentStatus, boolean][] = [
    ["SCREENING", "ENROLLED", true],
    ["SCREENING", "WITHDRAWN", true],
    ["SCREENING", "SCREENING", false],
    ["ENROLLED", "WITHDRAWN", true],
    ["ENROLLED", "SCREENING", false],
    ["WITHDRAWN", "ENROLLED", false],
    ["WITHDRAWN", "SCREENING", false],
  ];

  it.each(cases)("%s -> %s is %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});

describe("Consent hashing", () => {
  it("produces a stable SHA-256 hex digest", async () => {
    const buf = Buffer.from("demo consent pdf bytes");
    const hash = await hashFile(buf);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(await hashFile(Buffer.from("demo consent pdf bytes"))).toBe(hash);
  });

  it("detects tampering", async () => {
    const original = Buffer.from("consent v1");
    const tampered = Buffer.from("consent v2");
    const hash = await hashFile(original);
    expect(await verifyFileHash(original, hash)).toBe(true);
    expect(await verifyFileHash(tampered, hash)).toBe(false);
  });
});

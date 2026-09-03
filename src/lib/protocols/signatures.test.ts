import { describe, expect, it } from "vitest";
import {
  computeSignatureHash,
  escalatesToRA,
  isReAuthValid,
  RE_AUTH_WINDOW_MS,
} from "@/lib/protocols/signatures";

describe("E-signature hashing", () => {
  it("is deterministic for the same inputs", () => {
    const t = new Date("2026-09-03T10:00:00Z");
    const a = computeSignatureHash("user-1", "APPROVE", "looks good", t);
    const b = computeSignatureHash("user-1", "APPROVE", "looks good", t);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when any input changes", () => {
    const t = new Date("2026-09-03T10:00:00Z");
    const base = computeSignatureHash("user-1", "APPROVE", "ok", t);
    expect(computeSignatureHash("user-2", "APPROVE", "ok", t)).not.toBe(base);
    expect(computeSignatureHash("user-1", "REJECT", "ok", t)).not.toBe(base);
    expect(computeSignatureHash("user-1", "APPROVE", "ok2", t)).not.toBe(base);
  });
});

describe("Re-auth window", () => {
  it("accepts re-auth within 5 minutes", () => {
    const now = new Date("2026-09-03T10:00:00Z");
    const reAuth = new Date(now.getTime() - RE_AUTH_WINDOW_MS + 1000);
    expect(isReAuthValid(reAuth, now)).toBe(true);
  });

  it("rejects re-auth older than 5 minutes", () => {
    const now = new Date("2026-09-03T10:00:00Z");
    const reAuth = new Date(now.getTime() - RE_AUTH_WINDOW_MS - 1000);
    expect(isReAuthValid(reAuth, now)).toBe(false);
  });
});

describe("Deviation escalation", () => {
  it("escalates only critical deviations to Regulatory Affairs", () => {
    expect(escalatesToRA("MINOR")).toBe(false);
    expect(escalatesToRA("MAJOR")).toBe(false);
    expect(escalatesToRA("CRITICAL")).toBe(true);
  });
});

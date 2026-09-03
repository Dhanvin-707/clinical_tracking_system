import { describe, expect, it } from "vitest";
import { computeSignatureHash } from "@/lib/protocols/signatures";

describe("Signature audit chain", () => {
  it("signature hash is a valid 64-hex SHA-256", () => {
    const hash = computeSignatureHash("u1", "APPROVE", "ok", new Date());
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

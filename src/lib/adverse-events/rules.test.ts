import { describe, expect, it } from "vitest";
import {
  AE_CAUSALITIES,
  AE_SEVERITIES,
  isSeriousAdverseEvent,
  SAE_NOTIFY_HOURS,
} from "@/lib/adverse-events/rules";

describe("Adverse event rules", () => {
  it("flags only severe events as SAE", () => {
    expect(isSeriousAdverseEvent("MILD")).toBe(false);
    expect(isSeriousAdverseEvent("MODERATE")).toBe(false);
    expect(isSeriousAdverseEvent("SEVERE")).toBe(true);
  });

  it("defines the full severity and causality sets", () => {
    expect(AE_SEVERITIES).toEqual(["MILD", "MODERATE", "SEVERE"]);
    expect(AE_CAUSALITIES).toEqual(["UNRELATED", "POSSIBLE", "PROBABLE", "DEFINITE"]);
  });

  it("enforces the 24-hour SAE notification deadline", () => {
    expect(SAE_NOTIFY_HOURS).toBe(24);
  });
});

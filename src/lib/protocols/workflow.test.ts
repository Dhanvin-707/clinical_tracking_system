import { describe, expect, it } from "vitest";
import {
  canTransitionStatus,
  PROTOCOL_STATUSES,
  type ProtocolStatus,
} from "@/lib/protocols/workflow";

const PI = "PrincipalInvestigator";
const RA = "RegulatoryAffairs";
const RES = "Researcher";
const DM = "DataManager";

describe("Protocol status workflow", () => {
  it.each([
    ["DRAFT", "UNDER_REVIEW", RES, true],
    ["DRAFT", "UNDER_REVIEW", PI, true],
    ["DRAFT", "UNDER_REVIEW", DM, false],
    ["DRAFT", "APPROVED", PI, false],
    ["UNDER_REVIEW", "APPROVED", PI, true],
    ["UNDER_REVIEW", "APPROVED", RES, false],
    ["UNDER_REVIEW", "DRAFT", PI, true],
    ["UNDER_REVIEW", "DRAFT", RES, false],
    ["APPROVED", "ACTIVE", PI, true],
    ["APPROVED", "ACTIVE", RA, false],
    ["ACTIVE", "CLOSED", RA, true],
    ["ACTIVE", "CLOSED", PI, false],
    ["CLOSED", "ACTIVE", RA, false],
    ["CLOSED", "DRAFT", PI, false],
  ] as [ProtocolStatus, ProtocolStatus, string, boolean][])(
    "%s -> %s by %s is %s",
    (from, to, role, expected) => {
      expect(canTransitionStatus(from, to, role)).toBe(expected);
    }
  );

  it("orders the statuses from draft to closed", () => {
    expect(PROTOCOL_STATUSES).toEqual([
      "DRAFT",
      "UNDER_REVIEW",
      "APPROVED",
      "ACTIVE",
      "CLOSED",
    ]);
  });
});

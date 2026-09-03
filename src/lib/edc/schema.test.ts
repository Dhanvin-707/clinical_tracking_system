import { describe, expect, it } from "vitest";
import {
  validateEntry,
  type EdcSchema,
} from "@/lib/edc/schema";

const schema: EdcSchema = [
  { id: "f1", label: "Weight (kg)", type: "number", rules: { required: true, min: 10, max: 300 } },
  { id: "f2", label: "Notes", type: "text", rules: { required: true } },
  { id: "f3", label: "Stage", type: "dropdown", options: ["I", "II", "III"], rules: { required: true } },
  { id: "f4", label: "Consented", type: "checkbox" },
  { id: "f5", label: "Sample code", type: "text", rules: { regex: "^[A-Z]{3}[0-9]{3}$" } },
];

describe("EDC validation engine", () => {
  it("accepts valid data", () => {
    const errors = validateEntry(schema, {
      f1: 72,
      f2: "stable",
      f3: "II",
      f4: true,
      f5: "ABC123",
    });
    expect(errors).toEqual([]);
  });

  it("flags missing required fields", () => {
    const errors = validateEntry(schema, { f3: "I" });
    expect(errors.map((e) => e.fieldId)).toEqual(expect.arrayContaining(["f1", "f2"]));
  });

  it("enforces numeric ranges", () => {
    expect(validateEntry(schema, { f1: 5, f2: "x", f3: "I" })).toContainEqual(
      expect.objectContaining({ fieldId: "f1", message: expect.stringContaining("at least 10") })
    );
    expect(validateEntry(schema, { f1: 500, f2: "x", f3: "I" })).toContainEqual(
      expect.objectContaining({ fieldId: "f1", message: expect.stringContaining("at most 300") })
    );
  });

  it("rejects non-numeric values for number fields", () => {
    const errors = validateEntry(schema, { f1: "abc", f2: "x", f3: "I" });
    expect(errors).toContainEqual(
      expect.objectContaining({ fieldId: "f1", message: expect.stringContaining("must be a number") })
    );
  });

  it("rejects dropdown values outside options", () => {
    const errors = validateEntry(schema, { f1: 70, f2: "x", f3: "IV" });
    expect(errors).toContainEqual(
      expect.objectContaining({ fieldId: "f3", message: expect.stringContaining("one of") })
    );
  });

  it("enforces regex format", () => {
    const errors = validateEntry(schema, { f1: 70, f2: "x", f3: "I", f5: "abc" });
    expect(errors).toContainEqual(
      expect.objectContaining({ fieldId: "f5", message: expect.stringContaining("invalid format") })
    );
  });

  it("skips validation for absent optional fields", () => {
    const errors = validateEntry(schema, { f1: 70, f2: "x", f3: "I" });
    expect(errors).toEqual([]);
  });
});

export type EdcFieldType = "text" | "number" | "date" | "dropdown" | "checkbox";

export interface EdcFieldRules {
  required?: boolean;
  min?: number;
  max?: number;
  regex?: string;
}

export interface EdcField {
  id: string;
  label: string;
  type: EdcFieldType;
  options?: string[];
  rules?: EdcFieldRules;
}

export type EdcSchema = EdcField[];

export const FIELD_TYPES: { value: EdcFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export interface ValidationError {
  fieldId: string;
  message: string;
}

export function validateEntry(
  schema: EdcSchema,
  data: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of schema) {
    const value = data[field.id];
    const rules = field.rules ?? {};
    const present = value !== undefined && value !== null && value !== "";

    if (rules.required && !present) {
      errors.push({ fieldId: field.id, message: `${field.label} is required.` });
      continue;
    }
    if (!present) continue;

    if (field.type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors.push({ fieldId: field.id, message: `${field.label} must be a number.` });
        continue;
      }
      if (rules.min !== undefined && num < rules.min) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} must be at least ${rules.min}.`,
        });
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} must be at most ${rules.max}.`,
        });
      }
    }

    if (field.type === "dropdown" && field.options && !field.options.includes(String(value))) {
      errors.push({
        fieldId: field.id,
        message: `${field.label} must be one of: ${field.options.join(", ")}.`,
      });
    }

    if (rules.regex) {
      const re = new RegExp(rules.regex);
      if (!re.test(String(value))) {
        errors.push({
          fieldId: field.id,
          message: `${field.label} has an invalid format.`,
        });
      }
    }
  }

  return errors;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateEntry, type EdcSchema } from "@/lib/edc/schema";
import { submitEntryAction } from "@/lib/edc/actions";

export default function EntryForm({
  formId,
  patientId,
  schema,
}: {
  formId: string;
  patientId: string;
  schema: EdcSchema;
}) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(id: string, value: unknown) {
    setData((prev) => ({ ...prev, [id]: value }));
  }

  function validateClient(formData: FormData) {
    const next: Record<string, unknown> = {};
    for (const field of schema) {
      const raw = formData.get(field.id);
      if (field.type === "checkbox") {
        next[field.id] = raw === "on";
      } else if (field.type === "number") {
        next[field.id] = raw === "" || raw === null ? undefined : Number(raw);
      } else {
        next[field.id] = typeof raw === "string" ? raw : undefined;
      }
    }
    const validationErrors = validateEntry(schema, next);
    if (validationErrors.length > 0) {
      setErrors(
        Object.fromEntries(validationErrors.map((e) => [e.fieldId, e.message]))
      );
      return false;
    }
    setErrors({});
    return true;
  }

  return (
    <form
      action={submitEntryAction}
      onSubmit={(e) => {
        if (!validateClient(new FormData(e.currentTarget))) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <input type="hidden" name="form_id" value={formId} />
      <input type="hidden" name="patient_id" value={patientId} />
      <input type="hidden" name="data_json" value={JSON.stringify(data)} />

      {schema.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label htmlFor={`input-${field.id}`}>
            {field.label}
            {field.rules?.required && " *"}
          </Label>
          {field.type === "checkbox" ? (
            <input
              id={`input-${field.id}`}
              name={field.id}
              type="checkbox"
              onChange={(e) => setField(field.id, e.target.checked)}
              className="h-4 w-4"
            />
          ) : field.type === "dropdown" ? (
            <Select
              name={field.id}
              value={String(data[field.id] ?? "")}
              onValueChange={(v) => setField(field.id, v)}
            >
              <SelectTrigger id={`input-${field.id}`} className="w-full">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`input-${field.id}`}
              name={field.id}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={String(data[field.id] ?? "")}
              onChange={(e) =>
                setField(
                  field.id,
                  field.type === "number" ? Number(e.target.value) : e.target.value
                )
              }
            />
          )}
          {errors[field.id] && (
            <p className="text-xs text-destructive">{errors[field.id]}</p>
          )}
        </div>
      ))}

      <Button type="submit">Submit entry</Button>
    </form>
  );
}

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELD_TYPES, type EdcField, type EdcFieldType } from "@/lib/edc/schema";
import { saveFormSchemaAction } from "@/lib/edc/actions";

function newField(index: number): EdcField {
  return {
    id: `f_${Date.now()}_${index}`,
    label: `Field ${index + 1}`,
    type: "text",
    rules: { required: false },
  };
}

export default function FormBuilder({
  protocolId,
}: {
  protocolId: string;
}) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<EdcField[]>([newField(1)]);

  function updateField(id: string, patch: Partial<EdcField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function updateRules(id: string, patch: Partial<NonNullable<EdcField["rules"]>>) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, rules: { ...f.rules, ...patch } } : f))
    );
  }

  function addField() {
    setFields((prev) => [...prev, newField(prev.length + 1)]);
  }

  function removeField(id: string) {
    setFields((prev) => (prev.length > 1 ? prev.filter((f) => f.id !== id) : prev));
  }

  function moveField(id: string, dir: -1 | 1) {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  const schemaJson = JSON.stringify(fields);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="form-name">Form name</Label>
        <Input
          id="form-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Baseline Visit"
          required
        />
      </div>

      {fields.map((field, i) => (
        <Card key={field.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Field {i + 1}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveField(field.id, -1)}
                disabled={i === 0}
                aria-label={`Move field ${i + 1} up`}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => moveField(field.id, 1)}
                disabled={i === fields.length - 1}
                aria-label={`Move field ${i + 1} down`}
              >
                ↓
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeField(field.id)}
                disabled={fields.length === 1}
                aria-label={`Remove field ${i + 1}`}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`label-${field.id}`}>Label</Label>
              <Input
                id={`label-${field.id}`}
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`type-${field.id}`}>Type</Label>
              <Select
                value={field.type}
                onValueChange={(v) => {
                  if (v) updateField(field.id, { type: v as EdcFieldType });
                }}
              >
                <SelectTrigger id={`type-${field.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field.type === "dropdown" && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`options-${field.id}`}>Options (comma-separated)</Label>
                <Input
                  id={`options-${field.id}`}
                  value={field.options?.join(", ") ?? ""}
                  onChange={(e) =>
                    updateField(field.id, {
                      options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Option A, Option B"
                />
              </div>
            )}
            <div className="flex items-end gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.rules?.required ?? false}
                  onChange={(e) => updateRules(field.id, { required: e.target.checked })}
                />
                Required
              </label>
              {field.type === "number" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor={`min-${field.id}`}>Min</Label>
                    <Input
                      id={`min-${field.id}`}
                      type="number"
                      value={field.rules?.min ?? ""}
                      onChange={(e) =>
                        updateRules(field.id, {
                          min: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`max-${field.id}`}>Max</Label>
                    <Input
                      id={`max-${field.id}`}
                      type="number"
                      value={field.rules?.max ?? ""}
                      onChange={(e) =>
                        updateRules(field.id, {
                          max: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                  </div>
                </>
              )}
              {field.type === "text" && (
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`regex-${field.id}`}>Regex (optional)</Label>
                  <Input
                    id={`regex-${field.id}`}
                    value={field.rules?.regex ?? ""}
                    onChange={(e) =>
                      updateRules(field.id, {
                        regex: e.target.value === "" ? undefined : e.target.value,
                      })
                    }
                    placeholder="^[A-Z]{3}[0-9]{3}$"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addField}>
        Add field
      </Button>

      <form action={saveFormSchemaAction} className="pt-2">
        <input type="hidden" name="protocol_id" value={protocolId} />
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="schema_json" value={schemaJson} />
        <Button type="submit" disabled={!name.trim() || fields.length === 0}>
          Save form schema
        </Button>
      </form>
    </div>
  );
}

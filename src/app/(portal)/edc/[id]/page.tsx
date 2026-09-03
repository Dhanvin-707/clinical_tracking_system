import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EntryForm from "@/components/edc/EntryForm";
import { requireUser } from "@/lib/auth/rbac";
import { changeEntryStatusAction } from "@/lib/edc/actions";
import { type EdcSchema } from "@/lib/edc/schema";
import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EdcFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; msg?: string; submitted?: string }>;
}) {
  const profile = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: form } = await supabase
    .from("edc_forms")
    .select("*, protocols(title)")
    .eq("id", id)
    .single();
  if (!form) notFound();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, auto_id")
    .eq("enrollment_status", "ENROLLED")
    .order("full_name");

  const { data: entries } = await supabase
    .from("edc_entries")
    .select("*, patients(full_name, auto_id)")
    .eq("form_id", id)
    .order("updated_at", { ascending: false });

  const canEnter = ["Researcher", "LabTechnician", "Administrator"].includes(profile.role);
  const canReview = ["DataManager", "Administrator"].includes(profile.role);
  const schema = form.schema_json as EdcSchema;
  const defaultPatientId = patients?.[0]?.id ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{form.name}</h1>
          <p className="text-muted-foreground">
            {(form.protocols as { title?: string } | null)?.title ?? "—"} · v{form.version} ·{" "}
            {schema.length} fields
          </p>
        </div>
        <Badge variant="secondary">EDC form</Badge>
      </div>

      {q.submitted && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Entry submitted and validated.
        </p>
      )}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error === "validation"
            ? `Validation failed: ${q.msg ?? ""}`
            : q.error === "data"
              ? "Invalid entry data."
              : `${q.error}: ${q.msg ?? ""}`}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {canEnter && (patients?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New entry</CardTitle>
              <CardDescription>
                Data is validated client-side and enforced server-side.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {defaultPatientId ? (
                <EntryForm
                  formId={form.id}
                  patientId={defaultPatientId}
                  schema={schema}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No enrolled patients available for entry.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entries</CardTitle>
            <CardDescription>
              {(entries?.length ?? 0) > 0
                ? `${entries?.length} submission(s).`
                : "No submissions yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(entries ?? []).map((e) => {
              const entryData = e.data as Record<string, unknown>;
              const nextStatus =
                e.status === "DRAFT" ? "QUERY" : e.status === "QUERY" ? "CLEANED" : "LOCKED";
              return (
                <div key={e.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {(e.patients as { full_name?: string } | null)?.full_name ?? "—"}
                    </p>
                    <Badge
                      variant={
                        e.status === "LOCKED"
                          ? "default"
                          : e.status === "QUERY"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <dl className="mt-2 grid gap-1 text-xs">
                    {schema.map((f) => (
                      <div key={f.id} className="flex justify-between">
                        <dt className="text-muted-foreground">{f.label}</dt>
                        <dd>{String(entryData[f.id] ?? "—")}</dd>
                      </div>
                    ))}
                  </dl>
                  {e.query_note && (
                    <p className="mt-1 text-xs text-destructive">
                      Query: {e.query_note}
                    </p>
                  )}
                  {canReview && e.status !== "LOCKED" && (
                    <form
                      action={changeEntryStatusAction}
                      className="mt-2 flex items-end gap-2"
                    >
                      <input type="hidden" name="entry_id" value={e.id} />
                      <input type="hidden" name="to" value={nextStatus} />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`note-${e.id}`} className="text-xs">
                          {e.status === "DRAFT" ? "Query note" : "Note (optional)"}
                        </Label>
                        <Input id={`note-${e.id}`} name="note" />
                      </div>
                      <Button type="submit" variant="outline" size="sm">
                        {e.status === "DRAFT"
                          ? "Raise query"
                          : e.status === "QUERY"
                            ? "Mark cleaned"
                            : "Lock"}
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
            {(entries ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No entries yet. Submit the first one.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

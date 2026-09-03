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
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/rbac";
import {
  ENROLLMENT_LABELS,
  type EnrollmentStatus,
} from "@/lib/patients/enrollment";
import {
  changeEnrollmentAction,
  uploadConsentAction,
  verifyConsentAction,
} from "@/lib/patients/actions";
import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

function statusBadge(status: string) {
  if (status === "WITHDRAWN") return "destructive" as const;
  if (status === "ENROLLED") return "default" as const;
  return "secondary" as const;
}

function statusLabel(status: string) {
  return ENROLLMENT_LABELS[status as EnrollmentStatus] ?? status;
}

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    msg?: string;
    created?: string;
    transitioned?: string;
    consented?: string;
    verify?: string;
  }>;
}) {
  await requireRole("Researcher", "DataManager", "Administrator");
  const { id } = await params;
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();
  if (!patient) notFound();

  const { data: consents } = await supabase
    .from("consents")
    .select("*")
    .eq("patient_id", id)
    .order("consented_at", { ascending: false });

  const historyNotes = (patient.medical_history as { notes?: string } | null)?.notes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {patient.full_name}{" "}
            <span className="text-muted-foreground">({patient.auto_id})</span>
          </h1>
          <p className="text-muted-foreground">
            DOB {patient.dob} · {patient.gender}
          </p>
        </div>
        <Badge variant={statusBadge(patient.enrollment_status)}>
          {statusLabel(patient.enrollment_status)}
        </Badge>
      </div>

      {q.created && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Patient registered.
        </p>
      )}
      {q.transitioned && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Enrollment status updated.
        </p>
      )}
      {q.consented && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Consent uploaded and hashed.
        </p>
      )}
      {q.verify === "ok" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Consent verified — hash matches the stored record.
        </p>
      )}
      {q.verify === "fail" && (
        <p className="text-sm text-destructive">
          Verification failed — the file hash does not match the stored consent.
        </p>
      )}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error === "transition"
            ? `That enrollment transition is not allowed. ${q.msg ?? ""}`
            : q.error === "upload"
              ? `Consent upload failed. ${q.msg ?? ""}`
              : q.error === "verify"
                ? `Consent verification failed. ${q.msg ?? ""}`
                : `${q.error}: ${q.msg ?? ""}`}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medical history</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {historyNotes ? (
              <p className="whitespace-pre-wrap">{historyNotes}</p>
            ) : (
              <p className="text-muted-foreground">No history recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment</CardTitle>
            <CardDescription>
              SCREENING → ENROLLED → WITHDRAWN. Transitions are enforced.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.enrollment_status === "SCREENING" && (
              <form action={changeEnrollmentAction} className="flex gap-2">
                <input type="hidden" name="patient_id" value={patient.id} />
                <input type="hidden" name="to" value="ENROLLED" />
                <Button type="submit">Enroll</Button>
              </form>
            )}
            {patient.enrollment_status !== "WITHDRAWN" && (
              <form action={changeEnrollmentAction} className="space-y-3">
                <input type="hidden" name="patient_id" value={patient.id} />
                <input type="hidden" name="to" value="WITHDRAWN" />
                <div className="space-y-2">
                  <Label htmlFor="reason">Withdrawal reason</Label>
                  <Textarea id="reason" name="reason" />
                </div>
                <Button type="submit" variant="destructive">
                  Withdraw patient
                </Button>
              </form>
            )}
            {patient.enrollment_status === "WITHDRAWN" && (
              <p className="text-sm text-muted-foreground">
                Withdrawn on{" "}
                {patient.withdrawn_at
                  ? new Date(patient.withdrawn_at).toLocaleString()
                  : "—"}
                {patient.withdrawal_reason
                  ? `. Reason: ${patient.withdrawal_reason}`
                  : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consent records</CardTitle>
          <CardDescription>
            PDF uploads are SHA-256 hashed on upload and re-verified on demand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={uploadConsentAction} className="space-y-3">
            <input type="hidden" name="patient_id" value={patient.id} />
            <div className="space-y-2">
              <Label htmlFor="file">Upload consent form (PDF)</Label>
              <Input id="file" name="file" type="file" accept=".pdf" required />
            </div>
            <Button type="submit">Upload &amp; hash</Button>
          </form>

          {(consents ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No consent forms uploaded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {(consents ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border p-3 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{c.file_path.split("/").pop()}</span>
                    <Badge variant={c.verified_at ? "default" : "secondary"}>
                      {c.verified_at ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    SHA-256: {c.sha256_hash}
                  </p>
                  <form action={verifyConsentAction} className="flex items-end gap-2">
                    <input type="hidden" name="patient_id" value={patient.id} />
                    <input type="hidden" name="consent_id" value={c.id} />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`verify-${c.id}`} className="text-xs">
                        Re-verify with the same file
                      </Label>
                      <Input
                        id={`verify-${c.id}`}
                        name="file"
                        type="file"
                        accept=".pdf"
                        required
                      />
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                      Verify
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

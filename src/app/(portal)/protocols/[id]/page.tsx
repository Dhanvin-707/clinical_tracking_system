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
import { requireUser } from "@/lib/auth/rbac";
import {
  canTransitionStatus,
  PROTOCOL_STATUSES,
  PROTOCOL_STATUS_LABELS,
  type ProtocolStatus,
} from "@/lib/protocols/workflow";
import {
  changeStatusAction,
  editProtocolAction,
} from "@/lib/protocols/actions";
import { createSupabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default" as const;
    case "DRAFT":
      return "outline" as const;
    case "CLOSED":
      return "secondary" as const;
    default:
      return "secondary" as const;
  }
}

export default async function ProtocolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; msg?: string; edited?: string; transitioned?: string }>;
}) {
  const profile = await requireUser();
  const { id } = await params;
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: protocol } = await supabase
    .from("protocols")
    .select("*")
    .eq("id", id)
    .single();
  if (!protocol) notFound();

  const { data: versions } = await supabase
    .from("protocol_versions")
    .select("*")
    .eq("protocol_id", id)
    .order("version", { ascending: false });

  const currentStatus = protocol.status as ProtocolStatus;
  const canEdit = ["PrincipalInvestigator", "Administrator"].includes(profile.role);
  const status = protocol.status as ProtocolStatus;
  const availableTransitions = PROTOCOL_STATUSES.filter((to) =>
    canTransitionStatus(status, to, profile.role)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{protocol.title}</h1>
          <p className="text-muted-foreground">
            Version {protocol.current_version} · Created{" "}
            {new Date(protocol.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={statusBadge(currentStatus)}>
          {PROTOCOL_STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {q.edited && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Protocol updated.{" "}
          {protocol.status === "UNDER_REVIEW" &&
            "A new version was created and sent back to review."}
        </p>
      )}
      {q.transitioned && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Status updated.
        </p>
      )}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error === "transition"
            ? `That transition is not allowed for your role. ${q.msg ?? ""}`
            : q.error === "edit"
              ? `Edit failed. ${q.msg ?? ""}`
              : `${q.error}: ${q.msg ?? ""}`}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Objective</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {protocol.objective || "—"}
              </p>
            </div>
            <div>
              <p className="font-medium">Methodology</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {protocol.methodology || "—"}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium">Inclusion criteria</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {protocol.inclusion_criteria || "—"}
                </p>
              </div>
              <div>
                <p className="font-medium">Exclusion criteria</p>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {protocol.exclusion_criteria || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow</CardTitle>
              <CardDescription>Your next allowed actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No transitions available for your role.
                </p>
              ) : (
                availableTransitions.map((to) => (
                  <form key={to} action={changeStatusAction}>
                    <input type="hidden" name="protocol_id" value={protocol.id} />
                    <input type="hidden" name="to" value={to} />
                    <Button
                      type="submit"
                      variant={to === "DRAFT" ? "outline" : "default"}
                      className="w-full justify-start"
                    >
                      {PROTOCOL_STATUS_LABELS[to]}
                    </Button>
                  </form>
                ))
              )}
            </CardContent>
          </Card>

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit protocol</CardTitle>
                <CardDescription>
                  {["APPROVED", "ACTIVE", "CLOSED"].includes(currentStatus)
                    ? "Editing creates a new version and returns it to review."
                    : "Changes apply to the current draft."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={editProtocolAction} className="space-y-3">
                  <input type="hidden" name="protocol_id" value={protocol.id} />
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={protocol.title} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objective</Label>
                    <Textarea id="objective" name="objective" defaultValue={protocol.objective} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="methodology">Methodology</Label>
                    <Textarea id="methodology" name="methodology" defaultValue={protocol.methodology} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inclusion_criteria">Inclusion criteria</Label>
                    <Textarea
                      id="inclusion_criteria"
                      name="inclusion_criteria"
                      defaultValue={protocol.inclusion_criteria}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exclusion_criteria">Exclusion criteria</Label>
                    <Textarea
                      id="exclusion_criteria"
                      name="exclusion_criteria"
                      defaultValue={protocol.exclusion_criteria}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for change</Label>
                    <Input id="reason" name="reason" />
                  </div>
                  <Button type="submit">Save changes</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Version history</CardTitle>
          <CardDescription>
            Immutable snapshots. Approved/active protocols keep every version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(versions ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet.</p>
          ) : (
            <div className="space-y-3">
              {(versions ?? []).map((v) => (
                <div key={v.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Version {v.version}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-1 text-muted-foreground">{v.title}</p>
                  {v.reason && (
                    <p className="mt-1 text-xs">
                      <span className="font-medium">Reason:</span> {v.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/rbac";
import {
  AE_CAUSALITIES,
  AE_CAUSALITY_LABELS,
  AE_SEVERITIES,
  AE_SEVERITY_LABELS,
  SAE_NOTIFY_HOURS,
} from "@/lib/adverse-events/rules";
import { reportAdverseEventAction } from "@/lib/adverse-events/actions";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdverseEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string; reported?: string; sae?: string }>;
}) {
  const profile = await requireUser();
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: patients } = await supabase
    .from("patients")
    .select("id, full_name, auto_id")
    .order("full_name");

  const { data: protocols } = await supabase
    .from("protocols")
    .select("id, title")
    .order("title");

  const { data: events } = await supabase
    .from("adverse_events")
    .select("*, patients(full_name, auto_id), protocols(title)")
    .order("reported_at", { ascending: false });

  const canReport = ["Researcher", "DataManager", "PrincipalInvestigator", "Administrator"].includes(
    profile.role
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Adverse events</h1>
        <p className="text-muted-foreground">
          Serious events auto-notify Regulatory Affairs within {SAE_NOTIFY_HOURS} hours.
        </p>
      </div>

      {q.reported && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {q.sae === "1"
            ? "Serious adverse event reported — Regulatory Affairs notified."
            : "Adverse event reported."}
        </p>
      )}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error === "missing"
            ? "Please fill in all required fields."
            : `${q.error}: ${q.msg ?? ""}`}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {canReport && (patients?.length ?? 0) > 0 && (protocols?.length ?? 0) > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Report event</CardTitle>
              <CardDescription>
                SEVERE events are treated as serious (SAE).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={reportAdverseEventAction} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="patient_id">Patient</Label>
                  <Select name="patient_id" defaultValue={patients![0].id}>
                    <SelectTrigger id="patient_id" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {patients!.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.full_name} ({p.auto_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="protocol_id">Protocol</Label>
                  <Select name="protocol_id" defaultValue={protocols![0].id}>
                    <SelectTrigger id="protocol_id" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {protocols!.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="occurred_on">Date occurred</Label>
                  <Input id="occurred_on" name="occurred_on" type="date" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="severity">Severity</Label>
                    <Select name="severity" defaultValue="MILD">
                      <SelectTrigger id="severity" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AE_SEVERITIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {AE_SEVERITY_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="causality">Causality</Label>
                    <Select name="causality" defaultValue="POSSIBLE">
                      <SelectTrigger id="causality" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AE_CAUSALITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {AE_CAUSALITY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outcome">Outcome</Label>
                  <Input id="outcome" name="outcome" placeholder="Recovered, ongoing, …" />
                </div>
                <Button type="submit">Report event</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={canReport ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle className="text-base">Event log</CardTitle>
            <CardDescription>
              {(events?.length ?? 0) > 0
                ? `${events?.length} event(s) reported.`
                : "No events reported."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>SAE</TableHead>
                  <TableHead>Reported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{(e.patients as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>{(e.protocols as { title?: string } | null)?.title ?? "—"}</TableCell>
                    <TableCell>{e.occurred_on}</TableCell>
                    <TableCell>
                      <Badge variant={e.severity === "SEVERE" ? "destructive" : "secondary"}>
                        {AE_SEVERITY_LABELS[e.severity as keyof typeof AE_SEVERITY_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.is_sae ? <Badge variant="destructive">SAE</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.reported_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {(events ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No events yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

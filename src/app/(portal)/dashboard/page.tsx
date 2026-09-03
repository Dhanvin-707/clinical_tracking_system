import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser, ROLE_LABELS, type Profile } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { AesBySeverity } from "@/components/dashboard/AesBySeverity";

async function loadStats() {
  const supabase = await createSupabaseServer();
  const [patients, protocols, aes, entries, notifications] = await Promise.all([
    supabase.from("patients").select("enrollment_status"),
    supabase.from("protocols").select("status"),
    supabase.from("adverse_events").select("severity, is_sae"),
    supabase.from("edc_entries").select("status"),
    supabase.from("notifications").select("read_at"),
  ]);

  const countBy = (
    rows: { [key: string]: unknown }[] | null,
    key: string
  ): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const r of rows ?? []) {
      const v = String(r[key]);
      out[v] = (out[v] ?? 0) + 1;
    }
    return out;
  };

  return {
    patients: countBy(patients.data, "enrollment_status"),
    protocols: countBy(protocols.data, "status"),
    aes: countBy(aes.data, "severity"),
    saes: (aes.data ?? []).filter((a) => a.is_sae).length,
    entries: countBy(entries.data, "status"),
    unread: (notifications.data ?? []).filter((n) => !n.read_at).length,
    totalPatients: (patients.data ?? []).length,
    totalProtocols: (protocols.data ?? []).length,
    totalAes: (aes.data ?? []).length,
  };
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function RoleSummary({ profile }: { profile: Profile }) {
  const summaries: Record<string, string> = {
    Administrator: "Oversee users, access, and the audit trail.",
    Researcher: "Enroll patients and capture clinical data.",
    DataManager: "Review and clean submitted EDC data.",
    PrincipalInvestigator: "Review, sign, and activate protocols.",
    RegulatoryAffairs: "Monitor serious adverse events and close protocols.",
    LabTechnician: "Enter lab results into EDC forms.",
    QualityAssurance: "Verify audit-chain integrity and compliance.",
  };
  return <p className="text-sm text-muted-foreground">{summaries[profile.role]}</p>;
}

export default async function DashboardPage() {
  const profile = await requireUser();
  const stats = await loadStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Badge>{ROLE_LABELS[profile.role]}</Badge>
          <RoleSummary profile={profile} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients" value={stats.totalPatients} hint={`Enrolled: ${stats.patients.ENROLLED ?? 0}`} />
        <StatCard label="Protocols" value={stats.totalProtocols} hint={`Active: ${stats.protocols.ACTIVE ?? 0}`} />
        <StatCard label="Adverse events" value={stats.totalAes} hint={`Serious: ${stats.saes}`} />
        <StatCard label="Unread notifications" value={stats.unread} hint="Realtime updates" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment status</CardTitle>
            <CardDescription>Patient distribution across the state machine.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <EnrollmentChart data={stats.patients} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protocol pipeline</CardTitle>
            <CardDescription>Protocols by workflow status.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <StatusChart
              data={stats.protocols}
              order={["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "CLOSED"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adverse events by severity</CardTitle>
            <CardDescription>SEVERE events are serious (SAE).</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <AesBySeverity data={stats.aes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">EDC entry pipeline</CardTitle>
            <CardDescription>DRAFT → QUERY → CLEANED → LOCKED.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <StatusChart
              data={stats.entries}
              order={["DRAFT", "QUERY", "CLEANED", "LOCKED"]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

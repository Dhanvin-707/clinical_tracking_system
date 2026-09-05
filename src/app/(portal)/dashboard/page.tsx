import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TiltCard } from "@/components/ui/TiltCard";
import Link from "next/link";
import {
  FileCheck2,
  ScrollText,
  ClipboardCheck,
  Activity,
  Lock,
  ArrowRight,
} from "lucide-react";
import { requireUser, ROLE_LABELS } from "@/lib/auth/rbac";
import { NAV } from "@/lib/auth/nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { EnrollmentChart } from "@/components/dashboard/EnrollmentChart";
import { StatusChart } from "@/components/dashboard/StatusChart";
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

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  colour,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Activity;
  colour: string;
}) {
  return (
    <Card className="glass border-white/10 bg-white/[0.04] ring-white/10 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {label}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colour} text-white`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const PROTOCOL_ORDER = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "CLOSED"];
const EDC_ORDER = ["DRAFT", "QUERY", "CLEANED", "LOCKED"];

const ROLE_SUMMARIES: Record<string, string> = {
  Administrator: "Oversee users, access, and the audit trail.",
  Researcher: "Enroll patients and capture clinical data.",
  DataManager: "Review and clean submitted EDC data.",
  PrincipalInvestigator: "Review, sign, and activate protocols.",
  RegulatoryAffairs: "Monitor serious adverse events and close protocols.",
  LabTechnician: "Enter lab results into EDC forms.",
  QualityAssurance: "Verify audit-chain integrity and compliance.",
};

export default async function DashboardPage() {
  const profile = await requireUser();
  const stats = await loadStats();
  const allowedLinks = NAV[profile.role].map((item) => item.href);

  const domains = [
    {
      icon: FileCheck2,
      title: "Patients",
      desc: "Screening → enrolled → withdrawn state machine.",
      stat: stats.totalPatients,
      hint: `Enrolled: ${stats.patients.ENROLLED ?? 0}`,
      colour: "from-cyan-500 to-sky-500",
      href: allowedLinks.includes("/patients") ? "/patients" : undefined,
      chart: <EnrollmentChart data={stats.patients} />,
    },
    {
      icon: ClipboardCheck,
      title: "Protocols",
      desc: "Versioned protocol lifecycle, governed end to end.",
      stat: stats.totalProtocols,
      hint: `Active: ${stats.protocols.ACTIVE ?? 0}`,
      colour: "from-rose-500 to-pink-500",
      href: allowedLinks.includes("/protocols") ? "/protocols" : undefined,
      chart: <StatusChart data={stats.protocols} order={PROTOCOL_ORDER} />,
    },
    {
      icon: Activity,
      title: "Adverse events",
      desc: "Capture, classify and escalate adverse events.",
      stat: stats.totalAes,
      hint: `Serious: ${stats.saes}`,
      colour: "from-lime-500 to-emerald-500",
      href: allowedLinks.includes("/adverse-events")
        ? "/adverse-events"
        : undefined,
      chart: <AesBySeverity data={stats.aes} />,
    },
    {
      icon: ScrollText,
      title: "EDC entries",
      desc: "DRAFT → QUERY → CLEANED → LOCKED pipeline.",
      stat: Object.values(stats.entries).reduce((a, b) => a + b, 0) || 0,
      hint: `Locked: ${stats.entries.LOCKED ?? 0}`,
      colour: "from-violet-500 to-fuchsia-500",
      href: allowedLinks.includes("/edc") ? "/edc" : undefined,
      chart: <StatusChart data={stats.entries} order={EDC_ORDER} />,
    },
    {
      icon: Lock,
      title: "Audit trail",
      desc: "Immutable SHA-256 hash chain over every record.",
      stat: 0,
      hint: "Verifiable",
      colour: "from-emerald-500 to-teal-500",
      href: allowedLinks.includes("/audit") ? "/audit" : undefined,
      note:
        "Every critical record is chained with SHA-256. Verify the trail at any time — nothing can be altered behind your back.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HERO — ECG pulse canvas */}
      <DashboardHero
        name={profile.full_name.split(" ")[0]}
        roleLabel={ROLE_LABELS[profile.role]}
        summary={ROLE_SUMMARIES[profile.role] ?? ""}
      />

      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TiltCard>
          <StatCard
            label="Patients"
            value={stats.totalPatients}
            hint={`Enrolled: ${stats.patients.ENROLLED ?? 0}`}
            icon={FileCheck2}
            colour="from-cyan-500 to-sky-500"
          />
        </TiltCard>
        <TiltCard>
          <StatCard
            label="Protocols"
            value={stats.totalProtocols}
            hint={`Active: ${stats.protocols.ACTIVE ?? 0}`}
            icon={ClipboardCheck}
            colour="from-rose-500 to-pink-500"
          />
        </TiltCard>
        <TiltCard>
          <StatCard
            label="Adverse events"
            value={stats.totalAes}
            hint={`Serious: ${stats.saes}`}
            icon={Activity}
            colour="from-lime-500 to-emerald-500"
          />
        </TiltCard>
        <TiltCard>
          <StatCard
            label="Unread"
            value={stats.unread}
            hint="Realtime updates"
            icon={Lock}
            colour="from-violet-500 to-fuchsia-500"
          />
        </TiltCard>
      </div>

      {/* DOMAIN CARDS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {domains.map((d) => (
          <TiltCard key={d.title}>
            <Card className="h-full border-white/10 bg-white/[0.03] ring-white/10 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${d.colour} text-white shadow-lg shadow-black/30`}
                    >
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">
                        {d.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        {d.desc}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-white">
                      {d.stat > 0 ? d.stat : "—"}
                    </p>
                    <p className="text-xs text-zinc-500">{d.hint}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {d.chart ? (
                  <div className="h-52">{d.chart}</div>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {d.note}
                  </p>
                )}
                {d.href && (
                  <Link
                    href={d.href}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white underline-offset-4 transition-colors hover:text-zinc-300"
                  >
                    Open {d.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}

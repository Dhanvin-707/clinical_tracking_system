import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function EdcPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    msg?: string;
    saved?: string;
    submitted?: string;
    transitioned?: string;
  }>;
}) {
  const profile = await requireUser();
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  const { data: forms } = await supabase
    .from("edc_forms")
    .select("*, protocols(title)")
    .order("created_at", { ascending: false });

  const { data: entries } = await supabase
    .from("edc_entries")
    .select("*, patients(full_name, auto_id), edc_forms(name)")
    .order("updated_at", { ascending: false })
    .limit(20);

  const canBuild = ["Researcher", "PrincipalInvestigator", "Administrator"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">EDC</h1>
          <p className="text-muted-foreground">
            Electronic data capture — form schemas, data entry, review.
          </p>
        </div>
        {canBuild && (
          <Button>
            <Link href="/edc/build">Build form</Link>
          </Button>
        )}
      </div>

      {q.saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Form schema saved.</p>}
      {q.transitioned && <p className="text-sm text-emerald-600 dark:text-emerald-400">Entry status updated.</p>}
      {q.error && (
        <p className="text-sm text-destructive">
          {q.error === "missing"
            ? "Missing required fields."
            : q.error === "schema"
              ? "Invalid form schema."
              : q.error === "entry"
                ? `Entry status change failed. ${q.msg ?? ""}`
                : `${q.error}: ${q.msg ?? ""}`}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forms</CardTitle>
            <CardDescription>
              {(forms?.length ?? 0) > 0 ? `${forms?.length} form definition(s).` : "No forms yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Fields</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(forms ?? []).map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Link
                        href={`/edc/${f.id}`}
                        className="font-medium underline underline-offset-4"
                      >
                        {f.name}
                      </Link>
                    </TableCell>
                    <TableCell>{(f.protocols as { title?: string } | null)?.title ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">v{f.version}</Badge>
                    </TableCell>
                    <TableCell>{(f.schema_json as unknown[]).length}</TableCell>
                  </TableRow>
                ))}
                {(forms ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No forms yet. Build the first one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent entries</CardTitle>
            <CardDescription>Latest submissions across all forms.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entries ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{(e.patients as { full_name?: string } | null)?.full_name ?? "—"}</TableCell>
                    <TableCell>{(e.edc_forms as { name?: string } | null)?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={e.status === "LOCKED" ? "default" : e.status === "QUERY" ? "destructive" : "secondary"}
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(entries ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No entries yet.
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

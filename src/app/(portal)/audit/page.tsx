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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/rbac";
import { verifyAuditChain } from "@/lib/audit";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; user?: string; action?: string }>;
}) {
  await requireRole("Administrator", "QualityAssurance");
  const q = await searchParams;
  const supabase = await createSupabaseServer();

  let query = supabase.from("audit_log").select("*").order("id", { ascending: false }).limit(200);
  if (q.module) query = query.eq("module", q.module);
  if (q.action) query = query.eq("action", q.action);
  const { data: entries } = await query;

  const { data: modules } = await supabase
    .from("audit_log")
    .select("module")
    .order("module");
  const moduleSet = [...new Set((modules ?? []).map((m) => m.module as string))];

  const chain = await verifyAuditChain();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit trail</h1>
          <p className="text-muted-foreground">
            Immutable, SHA-256 hash-chained log. No updates or deletes are possible.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <a href="/api/audit/export?format=csv">Export CSV</a>
          </Button>
          <Button variant="outline" size="sm">
            <a href="/api/audit/export?format=json">Export JSON</a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chain integrity</CardTitle>
          <CardDescription>
            Every entry&apos;s hash is recomputed against its predecessor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chain.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No audit entries yet — the chain starts with the first action.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant={chain.invalid === 0 ? "default" : "destructive"}>
                {chain.invalid === 0
                  ? `Verified — ${chain.total} entries intact`
                  : `${chain.invalid} of ${chain.total} entries tampered`}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {chain.invalid === 0
                  ? "All hashes match. The chain is unbroken."
                  : "Tampering detected — do not trust this log."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Filter the log by module or action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3" method="get">
            <div className="space-y-1">
              <Label htmlFor="module">Module</Label>
              <select
                id="module"
                name="module"
                defaultValue={q.module ?? ""}
                className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm"
              >
                <option value="">All modules</option>
                {moduleSet.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                name="action"
                defaultValue={q.action ?? ""}
                placeholder="e.g. LOGIN"
                className="w-48"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline" size="sm">
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
          <CardDescription>Most recent 200 (newest first).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{e.id}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(e.ts).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{e.action}</TableCell>
                  <TableCell>{e.module}</TableCell>
                  <TableCell className="text-muted-foreground">{e.entity}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" title={e.hash}>
                      {e.hash.slice(0, 16)}…
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {(entries ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No entries match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

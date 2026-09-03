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
import {
  PROTOCOL_STATUS_LABELS,
  type ProtocolStatus,
} from "@/lib/protocols/workflow";
import { createSupabaseServer } from "@/lib/supabase/server";

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default" as const;
    case "CLOSED":
      return "secondary" as const;
    case "DRAFT":
      return "outline" as const;
    case "UNDER_REVIEW":
      return "secondary" as const;
    case "APPROVED":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

export default async function ProtocolsPage() {
  const profile = await requireUser();
  const supabase = await createSupabaseServer();
  const { data: protocols } = await supabase
    .from("protocols")
    .select("*")
    .order("created_at", { ascending: false });

  const canCreate = ["Researcher", "PrincipalInvestigator", "Administrator"].includes(
    profile.role
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Protocols</h1>
          <p className="text-muted-foreground">
            Trial protocols with versioned, approval-gated workflows.
          </p>
        </div>
        {canCreate && (
          <Button>
            <Link href="/protocols/new">New protocol</Link>
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All protocols</CardTitle>
          <CardDescription>
            {(protocols?.length ?? 0) > 0
              ? `${protocols!.length} protocol${protocols!.length === 1 ? "" : "s"}.`
              : "No protocols yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(protocols ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/protocols/${p.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell>v{p.current_version}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge(p.status)}>
                      {PROTOCOL_STATUS_LABELS[p.status as ProtocolStatus] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {(protocols ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No protocols yet. Create the first one.
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

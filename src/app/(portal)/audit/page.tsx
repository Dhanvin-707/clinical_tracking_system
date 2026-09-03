import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";

export default async function AuditPage() {
  await requireRole("Administrator", "QualityAssurance");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit trail</h1>
        <p className="text-muted-foreground">
          Immutable, hash-chained log of every system action.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming in Sprint 8</CardTitle>
          <CardDescription>
            The full audit viewer with filters, before/after diffs, and chain
            integrity verification lands in Sprint 8. Entries are already being
            recorded.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Logins, signups, and user-management actions from Sprint 1 are
          already in the chain.
        </CardContent>
      </Card>
    </div>
  );
}

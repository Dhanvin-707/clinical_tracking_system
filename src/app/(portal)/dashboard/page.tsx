import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser, ROLE_LABELS } from "@/lib/auth/rbac";

export default async function DashboardPage() {
  const profile = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile.full_name}.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Your role</CardTitle>
            <CardDescription>
              Access is scoped to your assigned role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge>{ROLE_LABELS[profile.role]}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Coming in later sprints
            </CardTitle>
            <CardDescription>
              Patients, protocols, EDC, adverse events, audit and dashboards
              land over the next sprints.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This space will hold role-specific trial metrics.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

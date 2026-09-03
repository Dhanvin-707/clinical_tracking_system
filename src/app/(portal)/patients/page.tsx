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
import { requireRole } from "@/lib/auth/rbac";
import {
  ENROLLMENT_LABELS,
  type EnrollmentStatus,
} from "@/lib/patients/enrollment";
import { createSupabaseServer } from "@/lib/supabase/server";

function statusBadge(status: string) {
  if (status === "WITHDRAWN") return "destructive" as const;
  if (status === "ENROLLED") return "default" as const;
  return "secondary" as const;
}

function statusLabel(status: string) {
  return ENROLLMENT_LABELS[status as EnrollmentStatus] ?? status;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}) {
  await requireRole("Researcher", "DataManager", "Administrator");
  const { error, msg } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Register participants and manage enrollment.
          </p>
        </div>
        <Button>
          <Link href="/patients/new">Register patient</Link>
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error === "missing"
            ? "Please fill in all required fields."
            : `${error}: ${msg ?? ""}`}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All patients</CardTitle>
          <CardDescription>
            {(patients?.length ?? 0) > 0
              ? `${patients?.length} patient${patients?.length === 1 ? "" : "s"} on record.`
              : "No patients yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date of birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(patients ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/patients/${p.id}`}
                      className="font-medium underline underline-offset-4"
                    >
                      {p.auto_id}
                    </Link>
                  </TableCell>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{p.dob}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge(p.enrollment_status)}>
                      {statusLabel(p.enrollment_status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(patients ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Register the first patient to get started.
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

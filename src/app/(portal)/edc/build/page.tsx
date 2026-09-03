import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormBuilderSelect from "@/components/edc/FormBuilderSelect";
import { requireRole } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function BuildFormPage() {
  await requireRole("Researcher", "PrincipalInvestigator", "Administrator");
  const supabase = await createSupabaseServer();
  const { data: protocols } = await supabase
    .from("protocols")
    .select("id, title")
    .order("title");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Build form</h1>
        <p className="text-muted-foreground">
          Define fields and validation rules. Saving creates a new version.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form builder</CardTitle>
          <CardDescription>
            Add fields, set types and rules, then save the schema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(protocols ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No protocols yet — create one first.
            </p>
          ) : (
            <FormBuilderSelect protocols={protocols ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

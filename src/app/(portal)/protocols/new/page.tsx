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
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/rbac";
import { createProtocolAction } from "@/lib/protocols/actions";

export default async function NewProtocolPage() {
  await requireRole("Researcher", "PrincipalInvestigator", "Administrator");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New protocol</h1>
        <p className="text-muted-foreground">
          Starts in DRAFT. Submit for review when ready.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Protocol details</CardTitle>
          <CardDescription>All fields except title are optional at draft stage.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProtocolAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Textarea id="objective" name="objective" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology</Label>
              <Textarea id="methodology" name="methodology" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inclusion_criteria">Inclusion criteria</Label>
                <Textarea id="inclusion_criteria" name="inclusion_criteria" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusion_criteria">Exclusion criteria</Label>
                <Textarea id="exclusion_criteria" name="exclusion_criteria" />
              </div>
            </div>
            <Button type="submit">Create protocol</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

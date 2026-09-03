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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/rbac";
import { registerPatientAction } from "@/lib/patients/actions";

export default async function NewPatientPage() {
  await requireRole("Researcher", "DataManager", "Administrator");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register patient</h1>
        <p className="text-muted-foreground">
          The patient ID is assigned automatically (PT-XXXX).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demographics</CardTitle>
          <CardDescription>
            All fields marked * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerPatientAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth *</Label>
                <Input id="dob" name="dob" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select name="gender" defaultValue="Female">
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical history notes</Label>
              <Textarea
                id="medical_history"
                name="medical_history"
                placeholder="Conditions, allergies, medications…"
              />
            </div>
            <Button type="submit">Register patient</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

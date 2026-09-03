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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS, requireRole, ROLES } from "@/lib/auth/rbac";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createUserAction, setUserActiveAction, setUserRoleAction } from "@/lib/users/actions";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string; created?: string }>;
}) {
  await requireRole("Administrator");
  const { error, msg, created } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Create accounts and assign roles across the seven trial roles.
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button />}>New user</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>
                The new user signs in with email + password and completes 2FA.
              </DialogDescription>
            </DialogHeader>
            <form action={createUserAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="Researcher">
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Create account</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {created && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          User created. They can sign in now.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          {error === "missing"
            ? "Please fill in all fields."
            : `${error}: ${msg ?? ""}`}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All accounts</CardTitle>
          <CardDescription>
            {profiles?.length ?? 0} account{(profiles?.length ?? 0) === 1 ? "" : "s"} registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(profiles ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    <form action={setUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <Select name="role" defaultValue={p.role}>
                        <SelectTrigger className="h-8 w-44" aria-label={`Role for ${p.full_name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="submit" variant="outline" size="sm">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "destructive"}>
                      {p.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={setUserActiveAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={p.is_active ? "false" : "true"}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className={p.is_active ? "text-destructive" : "text-emerald-600"}
                      >
                        {p.is_active ? "Disable" : "Enable"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {(profiles ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users yet. Create the first account.
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

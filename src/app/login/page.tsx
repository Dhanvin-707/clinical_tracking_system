import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { error, created } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Clinical Tracking System</CardTitle>
          <CardDescription>
            Sign in to your trial workspace. Demo data only.
          </CardDescription>
        </CardHeader>
        <form action={loginAction}>
          <CardContent className="space-y-4">
            {created && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Account created. Sign in to continue.
              </p>
            )}
            {error === "invalid" && (
              <p className="text-sm text-destructive">
                Invalid email or password.
              </p>
            )}
            {error === "missing" && (
              <p className="text-sm text-destructive">
                Please enter your email and password.
              </p>
            )}
            {error === "disabled" && (
              <p className="text-sm text-destructive">
                This account is disabled. Contact an administrator.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Request access
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

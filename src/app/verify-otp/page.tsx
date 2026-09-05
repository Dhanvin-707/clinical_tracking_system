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
import { resendOtpAction, verifyOtpAction } from "@/lib/auth/actions";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth/AuthShell";

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell>
        <Card className="glass w-full max-w-sm border-white/10 bg-white/[0.04] ring-white/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Session expired</CardTitle>
            <CardDescription className="text-zinc-400">
              Please sign in again to verify your identity.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full bg-white text-black hover:bg-white/85">
              <a href="/login">Back to sign in</a>
            </Button>
          </CardFooter>
        </Card>
      </AuthShell>
    );
  }

  const email = user.email ?? "";

  return (
    <AuthShell>
      <Card className="glass w-full max-w-sm border-white/10 bg-white/[0.04] ring-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl text-white">Two-factor verification</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter the one-time code sent to {email}.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col">
            <form action={verifyOtpAction}>
              <CardContent className="space-y-4">
                {error === "invalid" && (
                  <p className="text-sm text-destructive">
                    Invalid code. Please try again.
                  </p>
                )}
                {error === "missing" && (
                  <p className="text-sm text-destructive">
                    Please enter your verification code.
                  </p>
                )}
                <input type="hidden" name="email" value={email} />
                <div className="space-y-2">
                  <Label htmlFor="token">Verification code</Label>
                  <Input
                    id="token"
                    name="token"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/85">
                  Verify &amp; continue
                </Button>
              </CardFooter>
            </form>
            <form action={resendOtpAction} className="px-6 pb-6">
              <input type="hidden" name="email" value={email} />
              <Button type="submit" variant="ghost" className="w-full text-zinc-300 hover:bg-white/10 hover:text-white">
                Resend code
              </Button>
            </form>
          </div>
      </Card>
    </AuthShell>
  );
}

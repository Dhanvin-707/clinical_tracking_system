import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/auth/actions";
import { NAV } from "@/lib/auth/nav";
import { requireUser, ROLE_LABELS } from "@/lib/auth/rbac";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  if (!profile.is_active) redirect("/login?error=disabled");
  const nav = NAV[profile.role];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open navigation"
                />
              }
            >
              <span aria-hidden>☰</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">
                  Clinical Tracking
                </p>
                {nav.map((item) => (
                  <Button key={item.href} variant="ghost" className="justify-start">
                    <a href={item.href}>{item.label}</a>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="font-semibold">
            Clinical Tracking
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {nav.map((item) => (
              <Button key={item.href} variant="ghost" size="sm">
                <a href={item.href}>{item.label}</a>
              </Button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="gap-2" />}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {initials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{profile.full_name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile.full_name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {ROLE_LABELS[profile.role]} · {profile.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <footer className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        Demo system — not for real clinical data or medical decisions.
      </footer>
    </div>
  );
}

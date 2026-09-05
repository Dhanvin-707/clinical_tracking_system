import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0f]/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-rose-500 text-white shadow-[0_0_18px_rgba(139,92,246,0.5)]">
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight text-white">
            Clinical Tracking
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-300 hover:bg-white/10 hover:text-white"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Sign in
          </Button>
          <Button
            size="sm"
            className="bg-white text-black hover:bg-white/85"
            render={<Link href="/signup" />}
            nativeButton={false}
          >
            Request access
          </Button>
        </div>
      </div>
    </header>
  );
}

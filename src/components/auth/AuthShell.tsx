"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const HeroCanvas = dynamic(
  () =>
    import("@/components/three/RetroComputerCanvas").then(
      (m) => m.RetroComputerCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(34,255,102,0.08),transparent_60%)]" />
    ),
  }
);

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="dark relative flex min-h-screen flex-1 flex-col overflow-hidden bg-[#0a0a0f] text-zinc-100">
      {/* three.js background */}
      <div className="absolute inset-0" aria-hidden>
        <HeroCanvas />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.65)_78%)]" />
      </div>

      {/* back to home */}
      <div className="relative z-10 p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* glass card slot */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16">
        {children}
      </div>
    </main>
  );
}

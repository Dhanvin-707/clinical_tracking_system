"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";

const PulseCanvas = dynamic(
  () => import("@/components/three/PulseCanvas").then((m) => m.PulseCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.10),transparent_60%)]" />
    ),
  }
);

export function DashboardHero({
  name,
  roleLabel,
  summary,
}: {
  name: string;
  roleLabel: string;
  summary: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080914]">
      {/* pulse canvas background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <PulseCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,15,0.7)_90%)]" />
      </div>

      <div className="relative flex min-h-[300px] flex-col justify-center px-8 py-10 sm:min-h-[340px] sm:px-10">
        <Badge
          variant="outline"
          className="mb-4 w-fit gap-2 rounded-full border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          Demo workspace
        </Badge>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Good to see you,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">
            {name}
          </span>
          .
        </h1>
        <div className="mt-4 flex items-center gap-2">
          <Badge className="bg-white/10 text-white">{roleLabel}</Badge>
          <p className="text-sm text-zinc-400">
            {summary || "Your trial workspace at a glance."}
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useScroll, useTransform, useSpring, motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/Reveal";

const HeroCanvas = dynamic(
  () => import("@/components/three/HeroCanvas").then((m) => m.HeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_60%)]" />
    ),
  }
);

export function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 4]);
  const scrollTarget = useSpring(raw, { stiffness: 120, damping: 24, mass: 0.4 });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={wrapRef}
      className="relative flex h-[150vh] items-center justify-center overflow-hidden"
    >
      <div className="sticky top-0 flex min-h-screen items-center justify-center overflow-hidden">
        {/* three.js background */}
        <div className="absolute inset-0" aria-hidden>
          <HeroCanvas scrollTarget={scrollTarget} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.55)_78%)]" />
        </div>

        {/* content */}
        <motion.div
          className="relative mx-auto max-w-7xl px-6 pt-20 pb-16 text-center"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <Reveal delay={50}>
            <Badge
              variant="outline"
              className="mb-6 gap-2 rounded-full border-white/15 bg-white/5 px-4 py-1 text-xs text-zinc-300 backdrop-blur"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              PBL III · CSE20140 · Demo
            </Badge>
          </Reveal>
          <Reveal delay={150}>
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">
                Clinical trials data
              </span>
              , tracked with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300">
                integrity
              </span>{" "}
              at every step.
            </h1>
          </Reveal>
          <Reveal delay={250}>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-zinc-400">
              A full-stack clinical trials management platform with immutable
              SHA-256 audit chaining, e-signatures with re-authentication, and
              role-based access for every member of the trial team.
            </p>
          </Reveal>
          <Reveal delay={350}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-white/85"
                render={<Link href="/signup" />}
                nativeButton={false}
              >
                Request access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                Sign in to your workspace
              </Button>
            </div>
          </Reveal>
        </motion.div>

        {/* scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">
            Scroll to inspect
          </p>
          <ChevronDown className="scroll-hint mx-auto mt-1 h-5 w-5 text-zinc-400" />
        </div>
      </div>
    </section>
  );
}

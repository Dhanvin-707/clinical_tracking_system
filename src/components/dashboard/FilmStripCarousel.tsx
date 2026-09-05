"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  ScrollText,
  ClipboardCheck,
  Activity,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentChart } from "./EnrollmentChart";
import { StatusChart } from "./StatusChart";
import { AesBySeverity } from "./AesBySeverity";

type Panel = {
  icon: typeof Activity;
  title: string;
  stat: number;
  hint: string;
  colour: string;
  href?: string;
  chart?: React.ReactNode;
  note?: string;
};

const PROTOCOL_ORDER = ["DRAFT", "UNDER_REVIEW", "APPROVED", "ACTIVE", "CLOSED"];
const EDC_ORDER = ["DRAFT", "QUERY", "CLEANED", "LOCKED"];

function panelStyle(offset: number): React.CSSProperties {
  const a = Math.abs(offset);
  const sign = offset < 0 ? -1 : 1;
  const x = a === 0 ? 0 : sign * (250 + (a - 1) * 150);
  const rotateY = a === 0 ? 0 : sign * Math.min(20 + a * 12, 52);
  const translateZ = a === 0 ? 0 : -(60 + a * 90);
  const scale = a === 0 ? 1 : Math.max(1 - a * 0.12, 0.55);
  const opacity = a > 3 ? 0 : Math.max(1 - a * 0.18, 0.2);

  return {
    transform: `translateX(${x}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex: 10 - a,
    transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.6s",
    transformStyle: "preserve-3d",
  };
}

export function FilmStripCarousel({
  allowedLinks,
  stats,
}: {
  allowedLinks: string[];
  stats: {
    totalPatients: number;
    totalProtocols: number;
    totalAes: number;
    saes: number;
    entries: Record<string, number>;
    patients: Record<string, number>;
    protocols: Record<string, number>;
    aes: Record<string, number>;
  };
}) {
  const [index, setIndex] = useState(0);

  const panels: Panel[] = [
    {
      icon: FileCheck2,
      title: "Patients",
      stat: stats.totalPatients,
      hint: `Enrolled: ${stats.patients.ENROLLED ?? 0}`,
      colour: "from-cyan-500 to-sky-500",
      href: allowedLinks.includes("/patients") ? "/patients" : undefined,
      chart: <EnrollmentChart data={stats.patients} />,
    },
    {
      icon: ClipboardCheck,
      title: "Protocols",
      stat: stats.totalProtocols,
      hint: `Active: ${stats.protocols.ACTIVE ?? 0}`,
      colour: "from-rose-500 to-pink-500",
      href: allowedLinks.includes("/protocols") ? "/protocols" : undefined,
      chart: <StatusChart data={stats.protocols} order={PROTOCOL_ORDER} />,
    },
    {
      icon: Activity,
      title: "Adverse events",
      stat: stats.totalAes,
      hint: `Serious: ${stats.saes}`,
      colour: "from-lime-500 to-emerald-500",
      href: allowedLinks.includes("/adverse-events") ? "/adverse-events" : undefined,
      chart: <AesBySeverity data={stats.aes} />,
    },
    {
      icon: ScrollText,
      title: "EDC entries",
      stat: Object.values(stats.entries).reduce((a, b) => a + b, 0) || 0,
      hint: `Locked: ${stats.entries.LOCKED ?? 0}`,
      colour: "from-violet-500 to-fuchsia-500",
      href: allowedLinks.includes("/edc") ? "/edc" : undefined,
      chart: <StatusChart data={stats.entries} order={EDC_ORDER} />,
    },
    {
      icon: Lock,
      title: "Audit trail",
      stat: 0,
      hint: "SHA-256 hash chain",
      colour: "from-emerald-500 to-teal-500",
      href: allowedLinks.includes("/audit") ? "/audit" : undefined,
      note: "Every critical record is chained with SHA-256. Verify the trail at any time — nothing can be altered behind your back.",
    },
  ];

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => Math.max(0, Math.min(i + dir, panels.length - 1)));
    },
    [panels.length]
  );

  return (
    <section className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#080914] p-6 sm:p-10">
        {/* atmospheric glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 120%, rgba(56,189,248,0.10), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 50% -20%, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">
                Selected work
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">
                  Trial domains
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Previous"
                className="border-white/15 bg-black/40 text-white backdrop-blur hover:bg-white/10"
                onClick={() => go(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label="Next"
                className="border-white/15 bg-black/40 text-white backdrop-blur hover:bg-white/10"
                onClick={() => go(1)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* film strip stage */}
          <div
            className="relative h-[440px] sm:h-[480px]"
            style={{ perspective: "1300px" }}
          >
            {/* sprocket rails */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-2 z-20 h-3"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 8px, transparent 8px 18px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-2 z-20 h-3"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 8px, transparent 8px 18px)",
              }}
            />

            {/* panels */}
            <div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {panels.map((panel, i) => {
                const offset = i - index;
                const isActive = i === index;
                return (
                  <div
                    key={panel.title}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      ...panelStyle(offset),
                      marginLeft: "-160px",
                      marginTop: "-200px",
                    }}
                  >
                    <article
                      className={`glass group h-[380px] w-[300px] overflow-hidden rounded-2xl border p-5 backdrop-blur transition-all duration:300 sm:h-[400px] sm:w-[320px] ${
                        isActive
                          ? "border-white/30 shadow-[0_0_50px_rgba(139,92,246,0.35)]"
                          : "border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${panel.colour} text-white shadow-lg shadow-black/40 transition-transform group-hover:scale-110`}
                        >
                          <panel.icon className="h-5 w-5" />
                        </div>
                        <h3
                          className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${panel.colour}`}
                        >
                          {panel.title}
                        </h3>
                      </div>
                      <p className="mt-4 text-3xl font-semibold text-white">
                        {panel.stat > 0 ? panel.stat : "—"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">{panel.hint}</p>

                      {panel.chart ? (
                        <div className="mt-3 h-44">{panel.chart}</div>
                      ) : (
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                          {panel.note}
                        </p>
                      )}

                      {panel.href ? (
                        <Link
                          href={panel.href}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white underline-offset-4 transition-colors hover:text-zinc-300"
                        >
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          {/* pagination dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {panels.map((p, i) => (
              <button
                key={p.title}
                aria-label={p.title}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

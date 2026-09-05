"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileCheck2, ScrollText, ClipboardCheck, Activity, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnrollmentChart } from "./EnrollmentChart";
import { StatusChart } from "./StatusChart";
import { AesBySeverity } from "./AesBySeverity";

type DomainTile = {
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

export function DomainCarousel({
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const tiles: DomainTile[] = [
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
      stat: (Object.values(stats.entries).reduce((a, b) => a + b, 0)) || 0,
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

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, tiles.length - 1));
    const card = track.children[clamped] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft - 24,
        behavior: "smooth",
      });
    }
    setIndex(clamped);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const centre = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const d = Math.abs(el.offsetLeft - track.offsetLeft + el.clientWidth / 2 - centre);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setIndex(nearest);
  };

  return (
    <section className="relative">
      <div className="mb-4 flex items-center justify-between">
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
            aria-label="Previous domain"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => scrollTo(index - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Next domain"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => scrollTo(index + 1)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="carousel-snap flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
      >
        {tiles.map((tile) => (
          <article
            key={tile.title}
            className="glass group w-[82vw] flex-none snap-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-all duration-300 hover:border-white/25 hover:bg-white/[0.07] sm:w-[46%] lg:w-[31.5%]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tile.colour} text-white shadow-lg shadow-black/40 transition-transform group-hover:scale-110`}
              >
                <tile.icon className="h-5 w-5" />
              </div>
              <h3
                className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${tile.colour}`}
              >
                {tile.title}
              </h3>
            </div>
            <p className="mt-4 text-3xl font-semibold text-white">
              {tile.stat > 0 ? tile.stat : "—"}
            </p>
            <p className="mt-1 text-sm text-zinc-400">{tile.hint}</p>

            {tile.chart ? (
              <div className="mt-4 h-48">{tile.chart}</div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{tile.note}</p>
            )}

            {tile.href ? (
              <Link
                href={tile.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white underline-offset-4 transition-colors hover:text-zinc-300"
              >
                Open
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

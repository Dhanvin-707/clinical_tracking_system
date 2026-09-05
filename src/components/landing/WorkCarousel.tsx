"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { FEATURES } from "./features";

export function WorkCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, FEATURES.length - 1));
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
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm tracking-[0.2em] uppercase text-zinc-500">
              Selected work
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Browse the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">
                capabilities
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Previous feature"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => scrollTo(index - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Next feature"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => scrollTo(index + 1)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Reveal>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="carousel-snap mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
      >
        {FEATURES.map((f, i) => (
          <article
            key={f.title}
            className="glass group w-[82vw] flex-none snap-center rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition-all duration-300 hover:border-white/25 hover:bg-white/[0.07] sm:w-[46%] lg:w-[31.5%]"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.colour} text-white shadow-lg shadow-black/40 transition-transform group-hover:scale-110`}
            >
              <f.icon className="h-6 w-6" />
            </div>
            <p className="mt-6 text-xs tracking-[0.15em] uppercase text-zinc-500">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3
              className={`mt-2 text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${f.colour}`}
            >
              {f.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {f.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Manifesto } from "@/components/landing/Manifesto";
import { WorkCarousel } from "@/components/landing/WorkCarousel";
import { Contact } from "@/components/landing/Contact";
import { TRUST_BADGES } from "@/components/landing/features";

export default function Home() {
  return (
    <main className="dark flex flex-1 flex-col bg-[#0a0a0f] text-zinc-100">
      <Nav />
      <Hero />

      {/* TRUST BADGES */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6 py-8 text-sm text-zinc-400">
          {TRUST_BADGES.map(({ icon: Icon, colour, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${colour}`} /> {label}
            </span>
          ))}
        </div>
      </section>

      <WorkCarousel />

      <Manifesto />

      <Contact />

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-zinc-500">
        Demo system — not for real clinical data or medical decisions.
      </footer>
    </main>
  );
}

import { Reveal } from "@/components/Reveal";

const STATS = [
  { value: "4", label: "Patient states", colour: "from-cyan-400 to-violet-400" },
  { value: "6", label: "Trial roles", colour: "from-rose-400 to-amber-300" },
  { value: "SHA-256", label: "Audit hashing", colour: "from-emerald-400 to-sky-400" },
];

export function Manifesto() {
  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="animate-breathe absolute -top-32 right-[-100px] h-[420px] w-[420px] rounded-full bg-gradient-to-bl from-violet-500/10 via-cyan-400/10 to-emerald-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-6 py-28">
        <Reveal>
          <p className="text-sm tracking-[0.2em] uppercase text-zinc-500">
            The mission
          </p>
          <h2 className="mt-6 text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Making{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">
              clinical data
            </span>{" "}
            more{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300">
              powerful
            </span>
            , transparent and alive.
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-zinc-400">
            Every record is part of a verifiable hash chain. Every signature is
            re-authenticated. Every role sees exactly what it should — nothing
            more. Clinical Tracking turns a paper-heavy regulatory burden into a
            system that rewards curiosity: dig into any record and prove, step
            by step, that nothing was altered behind your back.
          </p>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/10 pt-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <p
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${s.colour} text-3xl font-semibold sm:text-4xl`}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

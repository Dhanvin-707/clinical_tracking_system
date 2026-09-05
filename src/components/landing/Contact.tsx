import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";

export function Contact() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-white/[0.02]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="animate-colour-shift absolute -top-24 left-1/4 h-[360px] w-[460px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-violet-400/15 to-rose-400/15 blur-3xl" />
        <div className="animate-breathe absolute bottom-[-120px] right-1/5 h-[320px] w-[320px] rounded-full bg-gradient-to-tl from-emerald-300/15 via-amber-300/15 to-sky-300/15 blur-3xl" />
      </div>
      <Reveal>
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-sm tracking-[0.2em] uppercase text-zinc-500">
            Contact
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300">
              Ready to run your trial
            </span>{" "}
            with confidence?
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Request access to the demo workspace and explore the workflow
            yourself.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Sign in
            </Button>
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Mail className="h-4 w-4" />
            General enquiries — admin@demo.test
          </p>
        </div>
      </Reveal>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";

const COLOURS = [
  "#22d3ee", // cyan
  "#a78bfa", // violet
  "#fb7185", // rose
  "#fbbf24", // amber
  "#34d399", // emerald
];

export function Stethoscope() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      wrap.style.setProperty("--tx", `${dx * -14}px`);
      wrap.style.setProperty("--ty", `${dy * -14}px`);
    };
    const onLeave = () => {
      wrap.style.setProperty("--tx", "0px");
      wrap.style.setProperty("--ty", "0px");
    };

    window.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none">
      <div
        ref={wrapRef}
        className="stetho-parallax relative mx-auto mt-6 h-40 w-40 sm:h-48 sm:w-48"
      >
        {/* orbiting colour dots */}
        {COLOURS.map((c, i) => (
          <span
            key={c}
            className="stetho-orbit absolute rounded-full"
            style={{
              width: 12,
              height: 12,
              backgroundColor: c,
              boxShadow: `0 0 18px ${c}`,
              // @ts-expect-error -- CSS custom prop
              "--delay": `${i * -1.1}s`,
              "--orbit-rot": `${i * 60}deg`,
            }}
          />
        ))}

        {/* revolving stethoscope */}
        <div className="stetho-spin absolute inset-0">
          <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="stem-colour" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>

            {/* ear tubes (Y split) */}
            <path
              d="M100 52 C 72 58, 70 96, 100 100"
              fill="none"
              stroke="#fb7185"
              strokeWidth={6}
              strokeLinecap="round"
            />
            <path
              d="M100 52 C 128 58, 130 96, 100 100"
              fill="none"
              stroke="#fbbf24"
              strokeWidth={6}
              strokeLinecap="round"
            />

            {/* stem down to chest piece */}
            <path
              d="M100 100 C 100 128, 100 148, 100 164"
              fill="none"
              stroke="url(#stem-colour)"
              strokeWidth={7}
              strokeLinecap="round"
            />

            {/* chest piece drum */}
            <circle cx="100" cy="176" r="20" fill="#0f172a" stroke="#34d399" strokeWidth={5} />
            <circle cx="100" cy="176" r="8" fill="#34d399" />
          </svg>
        </div>

        {/* pulsing heartbeat ring around chest piece */}
        <span className="stetho-beat absolute left-1/2 top-[86%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-400" />
      </div>
    </div>
  );
}

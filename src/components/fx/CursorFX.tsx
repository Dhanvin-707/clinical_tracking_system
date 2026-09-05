"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

const FINE_POINTER = "(pointer: fine)";
const NO_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const fine = window.matchMedia(FINE_POINTER);
  const motionMq = window.matchMedia(NO_MOTION);
  fine.addEventListener("change", callback);
  motionMq.addEventListener("change", callback);
  return () => {
    fine.removeEventListener("change", callback);
    motionMq.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  return (
    window.matchMedia(FINE_POINTER).matches &&
    !window.matchMedia(NO_MOTION).matches
  );
}

function getServerSnapshot() {
  return false;
}

export function CursorFX() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("cursor-fx-active");
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      setHovering(
        !!target?.closest(
          "a, button, [role='button'], input, textarea, select"
        )
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.body.classList.remove("cursor-fx-active");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-white/70 mix-blend-difference"
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: hovering ? 44 : 28,
          height: hovering ? 44 : 28,
          opacity: hovering ? 1 : 0.6,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      />
    </>
  );
}

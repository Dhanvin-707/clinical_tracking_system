"use client";

/* eslint-disable react-hooks/immutability */

import { useRef } from "react";
import { useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { DnaHelixScene } from "./DnaHelixScene";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(REDUCED_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

function ScrollRig({ scrollTarget }: { scrollTarget: MotionValue<number> }) {
  const camera = useThree((s) => s.camera);
  const current = useRef(0);
  // Standard R3F: mutate camera in the render loop.
  // eslint-disable-next-line react-hooks/immutability
  useFrame(() => {
    const target = scrollTarget.get();
    current.current += (target - current.current) * 0.08;
    camera.rotation.z = current.current * 0.12;
  });
  return null;
}

export function HeroCanvas({
  scrollTarget,
}: {
  scrollTarget?: MotionValue<number>;
}) {
  const reduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <Canvas
      aria-hidden
      className="pointer-events-none"
      camera={{ position: [0, 0, 6.5], fov: 50 }}
      dpr={[1, 2]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#0a0a0f", 0)}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 4, 6]} intensity={2.4} color="#c4b5fd" />
      <directionalLight position={[-6, -2, 4]} intensity={1.6} color="#67e8f9" />
      <directionalLight position={[0, -4, -2]} intensity={0.7} color="#fda4af" />
      <DnaHelixScene reduced={reduced} />
      {scrollTarget ? <ScrollRig scrollTarget={scrollTarget} /> : null}
    </Canvas>
  );
}

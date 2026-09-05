"use client";

import { useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { RetroComputerScene } from "./RetroComputerScene";

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

export function RetroComputerCanvas() {
  const reduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <Canvas
      aria-hidden
      className="pointer-events-none"
      camera={{ position: [0, 0.4, 7.5], fov: 42 }}
      dpr={[1, 2]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#0a0a0f", 0)}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 6, 8]} intensity={2.2} color="#fff4e0" />
      <directionalLight position={[-5, -2, 4]} intensity={1.0} color="#a78bfa" />
      <RetroComputerScene reduced={reduced} />
    </Canvas>
  );
}

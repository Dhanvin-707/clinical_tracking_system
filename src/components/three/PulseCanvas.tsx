"use client";

/* eslint-disable react-hooks/immutability */

import { useRef } from "react";
import { useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { PulseScene } from "./PulseScene";

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

function CameraRig({
  camZ,
  camY,
}: {
  camZ: MotionValue<number>;
  camY: MotionValue<number>;
}) {
  const camera = useThree((s) => s.camera);
  const target = useRef({ z: 7.2, y: 0.15 });
  // Standard R3F: mutate camera position in the render loop.
  // eslint-disable-next-line react-hooks/immutability
  useFrame(() => {
    target.current.z = camZ.get();
    target.current.y = camY.get();
    camera.position.z += (target.current.z - camera.position.z) * 0.08;
    camera.position.y += (target.current.y - camera.position.y) * 0.08;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function PulseCanvas({
  camZ,
  camY,
}: {
  camZ?: MotionValue<number>;
  camY?: MotionValue<number>;
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
      camera={{ position: [0, 0.15, 7.2], fov: 45 }}
      dpr={[1, 2]}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor("#0a0a0f", 0)}
    >
      <ambientLight intensity={1.2} />
      <PulseScene reduced={reduced} />
      {camZ && camY ? <CameraRig camZ={camZ} camY={camY} /> : null}
    </Canvas>
  );
}

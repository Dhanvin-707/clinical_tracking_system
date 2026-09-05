"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SCREEN_W = 512;
const SCREEN_H = 384;

function drawEcg(ctx: CanvasRenderingContext2D, t: number) {
  const w = SCREEN_W;
  const h = SCREEN_H;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#051005";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#22ff66";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#22ff66";
  ctx.shadowBlur = 14;

  ctx.beginPath();
  const midY = h / 2;
  for (let x = 0; x <= w; x += 4) {
    const phase = x / 60 - t * 4;
    let y = midY + Math.sin(phase * 0.6) * 6;
    const peak = Math.exp(-((x - w * 0.25) * (x - w * 0.25)) / 2200) *
      Math.sin((x - w * 0.25) / 16);
    y -= peak * 38;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#22ff66";
  ctx.font = "20px monospace";
  ctx.fillText("CLINICAL TRACKING v1.0", 24, 40);
  ctx.font = "13px monospace";
  ctx.fillText("PATIENT MONITOR — LIVE", 24, 64);
  ctx.fillStyle = "#22ff6688";
  ctx.fillText("SHA-256 AUDIT CHAIN: ACTIVE", 24, h - 24);
}

export function RetroComputerScene({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const screenCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    return canvas;
  }, []);

  useEffect(() => {
    if (!screenMatRef.current) return;
    const ctx = screenCanvas.getContext("2d");
    if (!ctx) return;
    const tex = new THREE.CanvasTexture(screenCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    screenMatRef.current.map = tex;
    screenMatRef.current.needsUpdate = true;
    return () => tex.dispose();
  }, [screenCanvas]);

  useFrame((state, delta) => {
    if (!reduced) {
      const ctx = screenCanvas.getContext("2d");
      if (ctx) {
        drawEcg(ctx, state.clock.elapsedTime);
        if (screenMatRef.current?.map) screenMatRef.current.map.needsUpdate = true;
      }
      const g = groupRef.current;
      if (g) {
        g.rotation.y += delta * 0.15;
        g.rotation.x = THREE.MathUtils.lerp(
          g.rotation.x,
          -pointer.current.y * 0.12,
          0.04
        );
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} rotation={[0.12, -0.35, 0]}>
      {/* chassis */}
      <mesh>
        <boxGeometry args={[4.4, 3.4, 3.1]} />
        <meshStandardMaterial color="#d8cfc0" roughness={0.55} />
      </mesh>

      {/* screen bezel */}
      <mesh position={[0, 0.28, 1.56]}>
        <boxGeometry args={[3.4, 2.3, 0.06]} />
        <meshStandardMaterial color="#3a342c" roughness={0.7} />
      </mesh>

      {/* screen */}
      <mesh position={[0, 0.28, 1.62]}>
        <planeGeometry args={[3.0, 1.9]} />
        <meshBasicMaterial ref={screenMatRef} color="#22ff66" toneMapped={false} />
      </mesh>

      {/* brand label */}
      <mesh position={[-1.15, -1.25, 1.58]}>
        <planeGeometry args={[1.7, 0.35]} />
        <meshBasicMaterial color="#3a342c" transparent opacity={0.9} />
      </mesh>

      {/* keyboard slope */}
      <mesh position={[0, -1.62, 0.35]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[4.0, 0.5, 2.1]} />
        <meshStandardMaterial color="#c9c0b2" roughness={0.6} />
      </mesh>
      {/* keyboard keys */}
      {Array.from({ length: 24 }).map((_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        return (
          <mesh
            key={i}
            position={[
              -1.75 + col * 0.5,
              -1.36 - row * 0.34,
              1.0 + row * 0.55,
            ]}
            rotation={[0.5, 0, 0]}
          >
            <boxGeometry args={[0.38, 0.18, 0.3]} />
            <meshStandardMaterial color="#8f8678" roughness={0.7} />
          </mesh>
        );
      })}

      {/* warm point light for glow */}
      <pointLight position={[0, 1.5, 2.5]} intensity={30} color="#f5e9d0" />
      <pointLight position={[0, 0.4, 2.2]} intensity={8} color="#22ff66" />
    </group>
  );
}

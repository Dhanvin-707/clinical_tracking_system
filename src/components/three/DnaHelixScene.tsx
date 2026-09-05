"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COLOURS = ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#34d399"];

const HELIX = { turns: 2.5, radius: 0.9, height: 6 };
const STRAND_COUNT = 160;
const RUNG_COUNT = 32;
const PARTICLE_COUNT = 320;
const UP = new THREE.Vector3(0, 1, 0);

function helixPoint(t: number, phase: number, out: THREE.Vector3) {
  const angle = t * HELIX.turns * Math.PI * 2 + phase;
  return out.set(
    Math.cos(angle) * HELIX.radius,
    (t - 0.5) * HELIX.height,
    Math.sin(angle) * HELIX.radius
  );
}

export function DnaHelixScene({
  reduced,
  scrollTarget = 0,
}: {
  reduced: boolean;
  scrollTarget?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const strandARef = useRef<THREE.InstancedMesh>(null);
  const strandBRef = useRef<THREE.InstancedMesh>(null);
  const rungRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const colour = new THREE.Color();

    for (let i = 0; i < STRAND_COUNT; i++) {
      const t = i / (STRAND_COUNT - 1);
      helixPoint(t, 0, a);
      m.setPosition(a);
      strandARef.current!.setMatrixAt(i, m);
      colour.set(COLOURS[i % COLOURS.length]);
      strandARef.current!.setColorAt(i, colour);

      helixPoint(t, Math.PI, b);
      m.setPosition(b);
      strandBRef.current!.setMatrixAt(i, m);
      colour.set(COLOURS[(i + 2) % COLOURS.length]);
      strandBRef.current!.setColorAt(i, colour);
    }
    strandARef.current!.instanceMatrix.needsUpdate = true;
    strandBRef.current!.instanceMatrix.needsUpdate = true;
    if (strandARef.current!.instanceColor)
      strandARef.current!.instanceColor.needsUpdate = true;
    if (strandBRef.current!.instanceColor)
      strandBRef.current!.instanceColor.needsUpdate = true;

    for (let i = 0; i < RUNG_COUNT; i++) {
      const t = (i + 0.5) / RUNG_COUNT;
      helixPoint(t, 0, a);
      helixPoint(t, Math.PI, b);
      mid.addVectors(a, b).multiplyScalar(0.5);
      dir.subVectors(b, a).normalize();
      q.setFromUnitVectors(UP, dir);
      m.compose(mid, q, new THREE.Vector3(1, a.distanceTo(b), 1));
      rungRef.current!.setMatrixAt(i, m);
      colour.set(COLOURS[i % COLOURS.length]);
      rungRef.current!.setColorAt(i, colour);
    }
    rungRef.current!.instanceMatrix.needsUpdate = true;
    if (rungRef.current!.instanceColor)
      rungRef.current!.instanceColor.needsUpdate = true;
  }, []);

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 1.7 + rand() * 2.6;
      const angle = rand() * Math.PI * 2;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = (rand() - 0.5) * 7.5;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (reduced) return;
    const group = groupRef.current;
    if (group) {
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        scrollTarget,
        0.08
      );
    }
    if (particlesRef.current)
      particlesRef.current.rotation.y -= delta * 0.04;

    const cam = state.camera;
    cam.position.x = THREE.MathUtils.lerp(
      cam.position.x,
      pointer.current.x * 0.9,
      0.04
    );
    cam.position.y = THREE.MathUtils.lerp(
      cam.position.y,
      -pointer.current.y * 0.6,
      0.04
    );
    cam.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={strandARef}
        args={[undefined, undefined, STRAND_COUNT]}
      >
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </instancedMesh>

      <instancedMesh
        ref={strandBRef}
        args={[undefined, undefined, STRAND_COUNT]}
      >
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial roughness={0.25} metalness={0.3} />
      </instancedMesh>

      <instancedMesh ref={rungRef} args={[undefined, undefined, RUNG_COUNT]}>
        <cylinderGeometry args={[0.045, 0.045, 1, 8]} />
        <meshStandardMaterial roughness={0.35} metalness={0.2} />
      </instancedMesh>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#22d3ee"
          transparent
          opacity={0.65}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

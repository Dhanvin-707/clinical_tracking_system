"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WAVES = 3;
const SEGMENTS = 260;
const LENGTH = 16;
const PULSE_SPEED = 0.7;
const PARTICLE_COUNT = 220;

const WAVE_COLOURS = ["#22d3ee", "#a78bfa", "#fb7185"];

const GROUND_Y = (i: number) => -1.15 + i * 1.15;

function flatlineY(x: number, t: number) {
  const phase = (x * 0.55 - t * 1.4) % (Math.PI * 2);
  let y = Math.sin(phase) * 0.12;
  y += Math.exp(-x * x * 0.55) * Math.sin(x * 2.2) * 1.4;
  return y;
}

function makeWaveBuffer(w: number) {
  const arr = new Float32Array((SEGMENTS + 1) * 3);
  const base = w - 1;
  for (let i = 0; i <= SEGMENTS; i++) {
    const x = -LENGTH / 2 + (i / SEGMENTS) * LENGTH;
    arr[i * 3] = x;
    arr[i * 3 + 1] = GROUND_Y(w) + flatlineY(x, 0) * (0.85 - w * 0.2) + base * 0.05;
    arr[i * 3 + 2] = 0;
  }
  return arr;
}

export function PulseScene({ reduced }: { reduced: boolean }) {
  const dotRefs = useRef<(THREE.Mesh | null)[]>([]);
  const particlesRef = useRef<THREE.Points>(null);

  const waveBuffers = useMemo(
    () => WAVE_COLOURS.map((_, w) => makeWaveBuffer(w)),
    []
  );

  const particles = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    let seed = 421;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (rand() - 0.5) * 16;
      arr[i * 3 + 1] = (rand() - 0.5) * 8;
      arr[i * 3 + 2] = (rand() - 0.5) * 2.5;
    }
    return arr;
  }, []);

  const pathGeom = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: SEGMENTS + 1 }, (_, i) => {
        const x = -LENGTH / 2 + (i / SEGMENTS) * LENGTH;
        return new THREE.Vector3(x, flatlineY(x, 0), 0);
      }),
      false,
      "catmullrom",
      0.25
    );
    return new THREE.TubeGeometry(curve, 300, 0.045, 10, false);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    for (let w = 0; w < WAVES; w++) {
      const base = w - 1;
      const line = state.scene.getObjectByName(`ecg-${w}`);
      if (line) {
        const geom = (line as THREE.LineSegments).geometry as THREE.BufferGeometry;
        const pos = geom.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i <= SEGMENTS; i++) {
          const x = -LENGTH / 2 + (i / SEGMENTS) * LENGTH;
          pos.setY(i, GROUND_Y(w) + flatlineY(x, t) * (0.85 - w * 0.2) + base * 0.05);
        }
        pos.needsUpdate = true;
        geom.computeBoundingSphere();
      }
      const dot = dotRefs.current[w];
      if (dot) {
        const x = ((t * PULSE_SPEED) % 1) * LENGTH - LENGTH / 2;
        dot.position.set(
          x,
          GROUND_Y(w) + flatlineY(x, t) * (0.85 - w * 0.2) + base * 0.05,
          0.28
        );
      }
    }

    if (particlesRef.current && !reduced) {
      particlesRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {WAVE_COLOURS.map((colour, w) => (
        <group key={colour} position={[0, w - 1, 0]}>
          <lineSegments name={`ecg-${w}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[waveBuffers[w], 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={colour}
              transparent
              opacity={0.85 - w * 0.22}
              depthWrite={false}
            />
          </lineSegments>
          <mesh
            ref={(el) => {
              dotRefs.current[w] = el;
            }}
            position={[0, GROUND_Y(w), 0.3]}
          >
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color={colour} />
          </mesh>
          <mesh position={[0, GROUND_Y(w), -0.1]}>
            <meshBasicMaterial color={colour} transparent opacity={0.15} depthWrite={false} />
            <sphereGeometry args={[0.34, 16, 16]} />
          </mesh>
          <mesh geometry={pathGeom} position={[0, 0, -0.05]}>
            <meshBasicMaterial color={colour} transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      ))}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#67e8f9"
          transparent
          opacity={0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

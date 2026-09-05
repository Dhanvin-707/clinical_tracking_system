"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setPos({ x: 0, y: 0 });
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl transition-transform duration-300 ease-out will-change-transform",
        hovering && "scale-[1.02]",
        className
      )}
    >
      {/* cursor-following glow */}
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(220px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.18), transparent 60%)`,
          }}
        />
      )}
      {/* top edge highlight on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </div>
  );
}

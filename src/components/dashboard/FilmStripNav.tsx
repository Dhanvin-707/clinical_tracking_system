"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/auth/nav";

export function FilmStripNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

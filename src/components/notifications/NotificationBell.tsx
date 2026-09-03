"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/lib/notifications/useNotifications";

export function NotificationBell() {
  const { unread } = useNotifications();

  return (
    <Link
      href="/notifications"
      className="relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={`Notifications (${unread} unread)`}
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
          {unread}
        </span>
      )}
    </Link>
  );
}

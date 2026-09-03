"use client";

import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export interface AppNotification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as AppNotification[];
    setNotifications(rows);
    setUnread(rows.filter((n) => !n.read_at).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;

      const rows = (data ?? []) as AppNotification[];
      setNotifications(rows);
      setUnread(rows.filter((n) => !n.read_at).length);
      setLoading(false);
    };
    void load();

    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { notifications, unread, loading, refresh };
}

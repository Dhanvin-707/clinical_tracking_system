"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import {
  useNotifications,
  type AppNotification,
} from "@/lib/notifications/useNotifications";

const TYPE_LABELS: Record<string, string> = {
  SAE_REPORT: "Serious adverse event",
  DEFAULT: "Notification",
};

export default function NotificationsPage() {
  const { notifications, unread, loading, refresh } = useNotifications();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markRead(n: AppNotification) {
    setBusyId(n.id);
    const supabase = createSupabaseBrowser();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", n.id);
    setBusyId(null);
    void refresh();
  }

  async function markAllRead() {
    const supabase = createSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    void refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unread} unread. Realtime updates arrive automatically.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inbox</CardTitle>
          <CardDescription>Most recent first.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notifications yet. SAE reports and approvals will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-3 text-sm ${
                    n.read_at ? "" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={n.type === "SAE_REPORT" ? "destructive" : "secondary"}>
                        {TYPE_LABELS[n.type] ?? TYPE_LABELS.DEFAULT}
                      </Badge>
                      {!n.read_at && <Badge>New</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.type === "SAE_REPORT"
                      ? `Severity: ${String(n.payload.severity ?? "—")} · Deadline: ${
                          n.payload.deadline_hours
                        } hours · AE ${String(n.payload.ae_id).slice(0, 8)}…`
                      : JSON.stringify(n.payload)}
                  </p>
                  {!n.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      disabled={busyId === n.id}
                      onClick={() => markRead(n)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

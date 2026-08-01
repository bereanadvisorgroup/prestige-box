"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { formatDistanceToNow } from "date-fns";
import { AtSign, Bell, MessageSquare, X } from "lucide-react";

import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import type { NoteNotification } from "@/types/notes";

const POLL_MS = 60_000;

export function NotificationBell() {
  const profile = useAuthStore((s) => s.profile);
  const isStaff = profile?.role === "admin" || profile?.role === "advisor";
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NoteNotification[]>([]);
  const [unread, setUnread] = React.useState(0);

  const load = React.useCallback(async () => {
    const res = await getNotifications(20);
    if (res.success) {
      setItems(res.notifications || []);
      setUnread(res.unread || 0);
    }
  }, []);

  React.useEffect(() => {
    if (!isStaff) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isStaff, load]);

  if (!isStaff) return null;

  const openNotification = async (n: NoteNotification) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id);
    }
    router.push(`/dashboard/crm/notes/${n.rootId ?? n.noteId}`);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  const removeOne = async (n: NoteNotification) => {
    setItems((prev) => prev.filter((i) => i.id !== n.id));
    if (!n.isRead) setUnread((u) => Math.max(0, u - 1));
    await deleteNotification(n.id);
  };

  const clearAll = async () => {
    setItems([]);
    setUnread(0);
    await clearAllNotifications();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-medium text-[10px] text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-medium text-sm">Notifications</span>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button type="button" onClick={markAll} className="text-muted-foreground text-xs hover:text-primary">
                  Mark all read
                </button>
              )}
              <button type="button" onClick={clearAll} className="text-muted-foreground text-xs hover:text-destructive">
                Clear all
              </button>
            </div>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-muted-foreground text-sm">You're all caught up.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-2 border-b transition-colors last:border-b-0 hover:bg-muted/50",
                  !n.isRead && "bg-primary/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="flex min-w-0 flex-1 items-start gap-2 py-2.5 pl-3 text-left"
                >
                  <span className="mt-0.5 text-muted-foreground">
                    {n.type === "mention" ? <AtSign className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">{n.preview || "New activity"}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
                <button
                  type="button"
                  onClick={() => removeOne(n)}
                  aria-label="Clear notification"
                  className="mt-2 mr-2 shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

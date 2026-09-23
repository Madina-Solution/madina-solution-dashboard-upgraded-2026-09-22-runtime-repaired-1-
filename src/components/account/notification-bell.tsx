"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";

type Props = { className?: string; href?: string };

export function NotificationBell({ className, href = "/account/notifications" }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unread, setUnread] = React.useState(0);
  const previousUnread = React.useRef(0);

  const load = React.useCallback(async () => {
    if (!user || document.hidden) return;
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) return;
      const nextUnread = Number(data.unreadCount || 0);
      if (nextUnread > previousUnread.current && previousUnread.current > 0) {
        toast({ type: "info", title: "Notifikasi baru", description: "Ada aktivitas baru pada akun Anda." });
      }
      previousUnread.current = nextUnread;
      setUnread(nextUnread);
    } catch {
      // Silent background refresh.
    }
  }, [toast, user]);

  React.useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => void load(), 5000);
    const onVisibility = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  return (
    <Link href={href} aria-label={unread ? `${unread} notifikasi belum dibaca` : "Notifikasi"} className={cn("relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-dark-500 transition hover:bg-dark-50 hover:text-dark dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white", className)}>
      <Bell className="h-5 w-5" />
      {unread > 0 && <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black leading-4 text-white ring-2 ring-white dark:ring-slate-950">{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}

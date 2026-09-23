"use client";

import * as React from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatDate } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async (silent = false) => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) return;
      setItems(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      if (!silent) toast({ type: "error", title: "Gagal memuat notifikasi" });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const initial = window.setTimeout(() => void fetchData(), 0);
    const interval = window.setInterval(() => {
      if (!document.hidden) void fetchData(true);
    }, 5000);
    const onVisibilityChange = () => {
      if (!document.hidden) void fetchData(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchData]);

  const markRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (response.ok) void fetchData(true);
  };

  const markAllRead = async () => {
    const response = await fetch("/api/notifications/read-all", { method: "POST" });
    if (!response.ok) {
      toast({ type: "error", title: "Gagal memperbarui notifikasi" });
      return;
    }
    toast({ type: "success", title: "Semua notifikasi dibaca" });
    void fetchData(true);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">System Inbox</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-dark dark:text-white">Notifikasi</h1>
          <p className="mt-1 text-sm text-dark-500 dark:text-slate-400">Pemberitahuan akun, pesanan, pembayaran, dan aktivitas operasional.</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={() => void markAllRead}><CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca</Button>}
      </header>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dark-100 bg-white px-6 text-center dark:border-slate-800 dark:bg-slate-950">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-7 w-7" /></div>
          <h2 className="mt-4 font-black text-dark dark:text-white">Belum Ada Notifikasi</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-dark-500 dark:text-slate-400">Notifikasi baru akan muncul otomatis saat ada aktivitas pada akun atau operasional Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((notification) => (
            <article key={notification.id} className={`rounded-2xl border bg-white p-4 dark:bg-slate-950 ${notification.readAt ? "border-dark-100 dark:border-slate-800" : "border-primary/20 bg-primary/[0.03] dark:border-primary/30 dark:bg-primary/[0.05]"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notification.readAt ? "bg-dark-100 text-dark-500 dark:bg-slate-900 dark:text-slate-400" : "bg-primary/10 text-primary"}`}><Bell className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-dark dark:text-white">{notification.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-dark-600 dark:text-slate-300">{notification.message}</p>
                      <p className="mt-2 text-xs text-dark-400 dark:text-slate-500">{formatDate(notification.createdAt)}</p>
                    </div>
                    {!notification.readAt && <Button variant="ghost" size="icon" onClick={() => void markRead(notification.id)} title="Tandai dibaca" aria-label="Tandai dibaca"><Check className="h-4 w-4" /></Button>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

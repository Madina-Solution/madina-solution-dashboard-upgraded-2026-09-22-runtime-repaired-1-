"use client";

import * as React from "react";
import { Bell, Loader2, Check, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatDate } from "@/lib/utils";

type Notification = { id: string; type: string; title: string; message: string; readAt: string | null; createdAt: string };

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/notifications"); const d = await r.json(); if (d.success) { setItems(d.notifications); setUnreadCount(d.unreadCount); } } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    const initial = window.setTimeout(() => { void fetchData(); }, 0);
    const interval = window.setInterval(() => { void fetchData(); }, 5000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, [fetchData]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    fetchData();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    toast({ type: "success", title: "Semua notifikasi dibaca" });
    fetchData();
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-2xl font-bold text-dark">Notifikasi</h2><p className="mt-1 text-dark-500">{unreadCount} belum dibaca</p></div>
        {unreadCount > 0 && <Button variant="outline" size="sm" className="shrink-0" onClick={markAllRead}><CheckCheck className="mr-1 h-4 w-4" />Tandai Semua Dibaca</Button>}
      </div>

      {isLoading ? <div className="mt-6 flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
      : items.length > 0 ? (
        <div className="mt-6 space-y-3">{items.map((n) => (
          <Card key={n.id} className={!n.readAt ? "border-primary/20 bg-primary/5" : ""}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex gap-3">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.readAt ? "bg-primary/20 text-primary" : "bg-dark-100 text-dark-400"}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className={`font-medium ${!n.readAt ? "text-dark" : "text-dark-600"}`}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-dark-500">{n.message}</p>
                  <p className="mt-1 text-xs text-dark-400">{formatDate(n.createdAt)}</p>
                </div>
              </div>
              {!n.readAt && <Button variant="ghost" size="icon" onClick={() => markRead(n.id)} title="Tandai dibaca"><Check className="h-4 w-4" /></Button>}
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card className="mt-6"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-10 w-10 text-dark-300" /><h3 className="mt-4 font-semibold text-dark">Belum Ada Notifikasi</h3>
          <p className="mt-1 text-sm text-dark-500">Notifikasi tentang pesanan dan aktivitas akan muncul di sini.</p>
        </CardContent></Card>
      )}
    </div>
  );
}

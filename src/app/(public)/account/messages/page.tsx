"use client";

import * as React from "react";
import { Send, Loader2, MessageSquare, Headset, Pencil, Trash2, X, Check, Trash, WalletCards } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  content: string;
  isMine: boolean;
  createdAt: string;
  orderId: string | null;
  orderNumber: string | null;
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(d: string) {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Hari ini";
  if (isYesterday) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);
  const [recentOrders, setRecentOrders] = React.useState<Array<{ id: string; orderNumber: string }>>([]);
  const [isClearing, setIsClearing] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const hasScrolledInitially = React.useRef(false);

  const fetchMessages = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/account/messages");
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch {
      if (!silent) toast({ type: "error", title: "Gagal memuat percakapan" });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void (async () => { await fetchMessages(); })();
    const interval = setInterval(() => void fetchMessages(true), 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  React.useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: hasScrolledInitially.current ? "smooth" : "auto" });
      hasScrolledInitially.current = true;
    }
  }, [messages]);

  React.useEffect(() => {
    fetch("/api/account/orders", { cache: "no-store" }).then((res) => res.json()).then((data) => {
      if (data.success) setRecentOrders((data.orders || []).slice(0, 8).map((order: { id: string; orderNumber: string }) => ({ id: order.id, orderNumber: order.orderNumber })));
    }).catch(() => undefined);
  }, []);

  const messagesWithDayLabels = React.useMemo(() => {
    return messages.map((m, i) => {
      const dayLabel = formatDayLabel(m.createdAt);
      const prevDayLabel = i > 0 ? formatDayLabel(messages[i - 1].createdAt) : null;
      return { ...m, dayLabel, showDayDivider: dayLabel !== prevDayLabel };
    });
  }, [messages]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setIsSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/account/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, orderId: selectedOrderId || undefined }) });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.item]);
        setSelectedOrderId("");
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal mengirim pesan" });
        setDraft(content);
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const startEdit = (m: Msg) => {
    setEditingId(m.id);
    setEditDraft(m.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (id: string) => {
    const content = editDraft.trim();
    if (!content) return;
    try {
      const res = await fetch(`/api/account/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
        setEditingId(null);
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal menyimpan perubahan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/account/messages/${deleteTarget}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== deleteTarget));
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal menghapus pesan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/account/messages", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMessages([]);
        toast({ type: "success", title: "Semua pesan dihapus" });
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal menghapus percakapan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    } finally {
      setIsClearing(false);
      setConfirmClearAll(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-dark-100 p-5 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Headset className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="font-semibold text-dark dark:text-white">Chat dengan Tim Kami</h2>
            <p className="truncate text-xs text-dark-500 dark:text-slate-400">Biasanya kami membalas dalam beberapa jam pada jam kerja</p><Link href="/account/finance" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"><WalletCards className="h-3 w-3" /> Lihat keuangan</Link>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setConfirmClearAll(true)} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50" aria-label="Hapus semua pesan">
            <Trash className="h-3.5 w-3.5" />Hapus Semua
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-dark-50/40 p-5 dark:bg-[#070b14]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-10 w-10 text-dark-300" />
            <p className="mt-4 font-semibold text-dark">Belum ada percakapan</p>
            <p className="mt-1 max-w-xs text-sm text-dark-500 dark:text-slate-400">Ada pertanyaan tentang pesanan, produk, atau layanan kami? Kirim pesan pertama Anda di bawah ini.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messagesWithDayLabels.map((m) => {
              const isEditing = editingId === m.id;
              return (
                <React.Fragment key={m.id}>
                  {m.showDayDivider && (
                    <div className="my-4 flex items-center justify-center"><span className="rounded-full bg-dark-100 px-3 py-1 text-xs font-semibold text-dark-500 dark:bg-slate-900 dark:text-slate-400">{m.dayLabel}</span></div>
                  )}
                  <div className={cn("group flex items-end gap-1.5", m.isMine ? "justify-end" : "justify-start")}>
                    {m.isMine && !isEditing && (
                      <div className="mb-1 hidden shrink-0 items-center gap-0.5 group-hover:flex">
                        <button onClick={() => startEdit(m)} className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 hover:text-dark-700 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Edit pesan"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(m.id)} className="rounded-lg p-1.5 text-dark-400 hover:bg-red-50 hover:text-red-500" aria-label="Hapus pesan"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm", m.isMine ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-dark-100 bg-white text-dark-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100")}>
                      {m.orderNumber && <p className={cn("mb-1 text-xs font-semibold", m.isMine ? "text-white/80" : "text-dark-500")}>Terkait pesanan {m.orderNumber}</p>}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-lg border-0 bg-white/20 px-2 py-1.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-white/50"
                            autoFocus
                          />
                          <div className="flex justify-end gap-1">
                            <button onClick={cancelEdit} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 hover:bg-white/30" aria-label="Batal"><X className="h-3.5 w-3.5" /></button>
                            <button onClick={() => void saveEdit(m.id)} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 hover:bg-white/30" aria-label="Simpan"><Check className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>
                          <p className={cn("mt-1 text-right text-[10px]", m.isMine ? "text-white/70" : "text-dark-400 dark:text-slate-500")}>{formatTime(m.createdAt)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-2 flex items-center gap-2"><select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="max-w-full rounded-lg border border-dark-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-dark-600 outline-none focus:border-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="">Tanpa konteks pesanan</option>{recentOrders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select>{selectedOrderId && <span className="text-[10px] font-semibold text-primary">Pesan ditautkan ke pesanan</span>}</div><div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan Anda..."
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Hapus pesan ini?" description="Pesan akan dihapus permanen." confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={confirmClearAll} title="Hapus semua pesan?" description="Seluruh riwayat percakapan Anda dengan tim kami akan dihapus permanen dan tidak bisa dikembalikan." confirmLabel="Hapus Semua" variant="danger" isLoading={isClearing} onConfirm={handleClearAll} onCancel={() => setConfirmClearAll(false)} />
    </div>
  );
}

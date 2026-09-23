"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Check, ChevronRight, Headset, Loader2, MessageSquare, Pencil, Search, Send, Trash, Trash2, UserCircle, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { SiteImage } from "@/components/ui/site-image";

const QUICK_REPLIES = [
  "Halo, terima kasih sudah menghubungi Madina Solution. Kami siap membantu.",
  "Baik, kami cek detail pesanan Anda terlebih dahulu. Mohon tunggu sebentar.",
  "Bukti pembayaran sudah kami terima dan akan kami verifikasi oleh tim.",
  "Pesanan Anda sedang kami proses. Kami akan memperbarui statusnya melalui akun Anda.",
  "Untuk mempercepat proses, silakan kirim detail ukuran, bahan, jumlah, dan deadline yang diinginkan.",
];

type Conversation = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerRole?: string;
  customerAvatar?: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

type ThreadMsg = {
  id: string;
  content: string;
  isMine: boolean;
  createdAt: string;
  orderId: string | null;
  orderNumber: string | null;
};

type CustomerOrder = { id: string; orderNumber: string; total: string; paymentStatus: string; status: string; createdAt: string };
type CustomerContext = {
  id: string; name: string; email: string; phone: string | null; avatar: string | null; role: string; createdAt: string;
};

type ThreadResponse = { customer: CustomerContext | null; customerOrders: CustomerOrder[]; financialSummary: { paidTotal: number; outstanding: number } | null; canViewFinance?: boolean; messages: ThreadMsg[] };

function formatTime(d: string) { return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); }
function formatDate(d: string) { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(d)); }
function formatRelative(d: string | null) {
  if (!d) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  return `${Math.floor(hours / 24)}h lalu`;
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [selected, setSelected] = React.useState<Conversation | null>(null);
  const [context, setContext] = React.useState<ThreadResponse | null>(null);
  const [isLoadingThread, setIsLoadingThread] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [isDeletingMsg, setIsDeletingMsg] = React.useState(false);
  const [confirmClearThread, setConfirmClearThread] = React.useState(false);
  const [isClearingThread, setIsClearingThread] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [quickReplyOpen, setQuickReplyOpen] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const fetchConversations = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch {
      if (!silent) toast({ type: "error", title: "Gagal memuat daftar percakapan" });
    } finally { if (!silent) setIsLoadingList(false); }
  }, [toast]);

  const fetchThread = React.useCallback(async (customerId: string, silent = false) => {
    if (!silent) setIsLoadingThread(true);
    try {
      const res = await fetch(`/api/admin/messages?customerId=${encodeURIComponent(customerId)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setContext({ customer: data.customer, customerOrders: data.customerOrders || [], financialSummary: data.financialSummary || null, canViewFinance: Boolean(data.canViewFinance), messages: data.messages || [] });
    } catch {
      if (!silent) toast({ type: "error", title: "Gagal memuat percakapan" });
    } finally { if (!silent) setIsLoadingThread(false); }
  }, [toast]);

  React.useEffect(() => {
    const initialFetch = window.setTimeout(() => { void fetchConversations(); }, 0);
    const interval = window.setInterval(() => void fetchConversations(true), 10000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchConversations]);

  React.useEffect(() => {
    if (!selected) return;
    const initialFetch = window.setTimeout(() => { void fetchThread(selected.customerId); }, 0);
    const interval = window.setInterval(() => void fetchThread(selected.customerId, true), 6000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [selected, fetchThread]);

  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [context?.messages]);

  const openConversation = (conversation: Conversation) => {
    setContext(null);
    setSelectedOrderId("");
    setSelected(conversation);
  };

  const closeConversation = () => {
    setSelected(null);
    setContext(null);
    setSelectedOrderId("");
  };
  const thread = context?.messages || [];

  const filteredConversations = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (unreadOnly && conversation.unreadCount === 0) return false;
      if (!needle) return true;
      return [conversation.customerName, conversation.customerEmail, conversation.lastMessage].some((value) => value.toLowerCase().includes(needle));
    });
  }, [conversations, query, unreadOnly]);

  const handleSend = async () => {
    if (!selected) return;
    const content = draft.trim();
    if (!content) return;
    setIsSending(true); setDraft("");
    try {
      const response = await fetch("/api/admin/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: selected.customerId, content, orderId: selectedOrderId || undefined }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal mengirim balasan");
      setContext((current) => current ? { ...current, messages: [...current.messages, data.item] } : current);
      setSelectedOrderId("");
      void fetchConversations(true);
    } catch (error) {
      setDraft(content); toast({ type: "error", title: error instanceof Error ? error.message : "Gagal mengirim balasan" });
    } finally { setIsSending(false); }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); }
  };
  const saveEdit = async (id: string) => {
    const content = editDraft.trim(); if (!content) return;
    try {
      const response = await fetch(`/api/admin/messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal menyimpan perubahan");
      setContext((current) => current ? { ...current, messages: current.messages.map((message) => message.id === id ? { ...message, content } : message) } : current);
      setEditingId(null); setEditDraft("");
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menyimpan perubahan" }); }
  };
  const handleDeleteMessage = async () => {
    if (!deleteTarget) return; setIsDeletingMsg(true);
    try {
      const response = await fetch(`/api/admin/messages/${deleteTarget}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal menghapus pesan");
      setContext((current) => current ? { ...current, messages: current.messages.filter((message) => message.id !== deleteTarget) } : current);
      void fetchConversations(true);
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menghapus pesan" }); }
    finally { setIsDeletingMsg(false); setDeleteTarget(null); }
  };
  const handleClearThread = async () => {
    if (!selected) return; setIsClearingThread(true);
    try {
      const response = await fetch(`/api/admin/messages?customerId=${encodeURIComponent(selected.customerId)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal menghapus percakapan");
      setSelected(null); setContext(null); setConversations((current) => current.filter((item) => item.customerId !== selected.customerId)); toast({ type: "success", title: "Percakapan dihapus" });
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menghapus percakapan" }); }
    finally { setIsClearingThread(false); setConfirmClearThread(false); }
  };

  const customer = context?.customer;
  const finance = context?.financialSummary;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Customer Communication</p><h1 className="mt-1 text-2xl font-black tracking-tight text-dark dark:text-white">Pesan</h1><p className="mt-1 text-sm text-dark-500 dark:text-slate-400">Pusat komunikasi pelanggan dengan konteks akun, pesanan, dan keuangan.</p></div>
        <div className="rounded-2xl border border-dark-100 bg-white px-4 py-3 text-xs font-semibold text-dark-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"><span className="font-black text-dark dark:text-white">{conversations.length}</span> percakapan · refresh otomatis</div>
      </header>

      <div className="grid overflow-hidden rounded-[26px] border border-dark-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,.06)] dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[320px_minmax(0,1fr)_290px]" style={{ minHeight: "calc(100vh - 265px)" }}>
        <aside className={cn("flex-col border-dark-100 dark:border-slate-800 lg:flex lg:border-r", selected ? "hidden lg:flex" : "flex")}>
          <div className="border-b border-dark-100 p-3 dark:border-slate-800">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pelanggan atau pesan" className="h-10 w-full rounded-xl border border-dark-200 bg-dark-50 pl-9 pr-3 text-sm text-dark outline-none focus:border-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></div>
            <button type="button" onClick={() => setUnreadOnly((value) => !value)} className={cn("mt-2 rounded-full px-3 py-1.5 text-xs font-bold", unreadOnly ? "bg-primary text-white" : "bg-dark-100 text-dark-600 dark:bg-slate-900 dark:text-slate-300")}>{unreadOnly ? "Belum dibaca saja" : "Semua percakapan"}</button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            {isLoadingList ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : filteredConversations.length === 0 ? <div className="px-6 py-16 text-center"><MessageSquare className="mx-auto h-10 w-10 text-dark-300 dark:text-slate-700" /><p className="mt-4 font-bold text-dark dark:text-white">Tidak ada percakapan</p><p className="mt-1 text-sm text-dark-500 dark:text-slate-400">Coba ubah pencarian atau filter.</p></div> : filteredConversations.map((conversation) => <button key={conversation.customerId} onClick={() => openConversation(conversation)} className={cn("flex w-full items-start gap-3 border-b border-dark-50 p-4 text-left transition hover:bg-dark-50/70 dark:border-slate-900 dark:hover:bg-slate-900/70", selected?.customerId === conversation.customerId && "bg-primary/[0.06]")}>{conversation.customerAvatar ? <SiteImage src={conversation.customerAvatar} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{conversation.customerName.charAt(0).toUpperCase()}</span>}<span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold text-dark dark:text-white">{conversation.customerName}</span><span className="shrink-0 text-[10px] text-dark-400">{formatRelative(conversation.lastMessageAt)}</span></span><span className="mt-0.5 block truncate text-xs text-dark-500 dark:text-slate-400">{conversation.lastMessage || "Belum ada isi pesan"}</span></span>{conversation.unreadCount > 0 && <span className="mt-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white">{conversation.unreadCount}</span>}</button>)}
          </div>
        </aside>

        <section className={cn("min-w-0 flex-col", selected ? "flex" : "hidden lg:flex")}>
          {!selected ? <div className="flex h-full min-h-[560px] items-center justify-center px-8 text-center"><div><Headset className="mx-auto h-12 w-12 text-dark-300 dark:text-slate-700" /><h2 className="mt-4 text-lg font-black text-dark dark:text-white">Pilih percakapan</h2><p className="mt-1 max-w-sm text-sm leading-6 text-dark-500 dark:text-slate-400">Pilih pelanggan untuk melihat percakapan, order, role, dan ringkasan keuangannya dalam satu layar.</p></div></div> : <>
            <div className="flex items-center justify-between gap-3 border-b border-dark-100 px-4 py-3 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-2"><button className="rounded-lg p-1.5 text-dark-500 hover:bg-dark-100 dark:hover:bg-slate-900 lg:hidden" onClick={closeConversation} aria-label="Kembali"><ArrowLeft className="h-5 w-5" /></button><div className="min-w-0"><p className="truncate font-black text-dark dark:text-white">{customer?.name || selected.customerName}</p><p className="truncate text-xs text-dark-500 dark:text-slate-400">{customer?.email || selected.customerEmail}</p></div></div>
              <div className="flex items-center gap-1"><button type="button" onClick={() => setQuickReplyOpen((open) => !open)} className="hidden rounded-xl border border-dark-200 px-3 py-2 text-xs font-bold text-dark-600 hover:bg-dark-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 sm:inline-flex">Balasan cepat</button><button type="button" onClick={() => setConfirmClearThread(true)} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" aria-label="Hapus percakapan"><Trash className="h-4 w-4" /></button></div>
            </div>
            {quickReplyOpen && <div className="border-b border-dark-100 bg-dark-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/70"><div className="grid gap-2 sm:grid-cols-2">{QUICK_REPLIES.map((reply) => <button key={reply} type="button" onClick={() => { setDraft(reply); setQuickReplyOpen(false); }} className="rounded-xl border border-dark-100 bg-white px-3 py-2.5 text-left text-xs font-medium leading-5 text-dark-700 hover:border-primary/30 hover:bg-primary/[0.03] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{reply}</button>)}</div></div>}
            <div className="min-h-0 flex-1 overflow-y-auto bg-dark-50/40 p-4 dark:bg-[#070b14]">
              {isLoadingThread ? <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : thread.length === 0 ? <div className="flex h-full items-center justify-center text-center"><div><MessageSquare className="mx-auto h-9 w-9 text-dark-300 dark:text-slate-700" /><p className="mt-3 font-bold text-dark dark:text-white">Percakapan baru</p><p className="mt-1 text-sm text-dark-500 dark:text-slate-400">Mulai percakapan dengan pelanggan ini.</p></div></div> : <div className="space-y-2">{thread.map((message) => { const editing = editingId === message.id; return <div key={message.id} className={cn("group flex items-end gap-1.5", message.isMine ? "justify-end" : "justify-start")}><div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm", message.isMine ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-dark-100 bg-white text-dark-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100")}>{message.orderNumber && <Link href={`/admin/orders/${message.orderId}`} className={cn("mb-1 inline-flex items-center gap-1 text-[10px] font-black", message.isMine ? "text-white/80" : "text-primary")}>Pesanan {message.orderNumber}<ChevronRight className="h-3 w-3" /></Link>}{editing ? <div className="space-y-2"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} rows={3} className="w-full resize-none rounded-lg border-0 bg-white/15 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-white/20" autoFocus /><div className="flex justify-end gap-1"><button type="button" onClick={() => { setEditingId(null); setEditDraft(""); }} className="h-7 w-7 rounded-md bg-white/10 hover:bg-white/20" aria-label="Batal"><X className="mx-auto h-3.5 w-3.5" /></button><button type="button" onClick={() => void saveEdit(message.id)} className="h-7 w-7 rounded-md bg-white/10 hover:bg-white/20" aria-label="Simpan"><Check className="mx-auto h-3.5 w-3.5" /></button></div></div> : <><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p><p className={cn("mt-1 text-right text-[10px]", message.isMine ? "text-white/65" : "text-dark-400 dark:text-slate-500")}>{formatTime(message.createdAt)}</p></> }</div>{message.isMine && !editing && <div className="hidden shrink-0 gap-0.5 pb-1 group-hover:flex"><button type="button" onClick={() => { setEditingId(message.id); setEditDraft(message.content); }} className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 dark:hover:bg-slate-800" aria-label="Edit pesan"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleteTarget(message.id)} className="rounded-lg p-1.5 text-dark-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30" aria-label="Hapus pesan"><Trash2 className="h-3.5 w-3.5" /></button></div>}</div>; })}<div ref={bottomRef} /></div>}
            </div>
            <div className="border-t border-dark-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="mb-2 flex items-center gap-2"><select value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="max-w-full rounded-lg border border-dark-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-dark-600 outline-none focus:border-primary/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><option value="">Tanpa konteks pesanan</option>{(context?.customerOrders || []).map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select>{selectedOrderId && <span className="text-[10px] font-semibold text-primary">Balasan akan ditautkan ke pesanan</span>}</div><div className="flex items-end gap-2 rounded-2xl border border-dark-200 bg-dark-50 p-2 dark:border-slate-700 dark:bg-slate-900"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="Tulis balasan… Enter untuk kirim, Shift+Enter untuk baris baru" className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-dark-900 outline-none placeholder:text-dark-400 dark:text-slate-100 dark:placeholder:text-slate-500" /><button type="button" onClick={() => void handleSend()} disabled={isSending || !draft.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:opacity-40" aria-label="Kirim balasan">{isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div>
          </>}
        </section>

        <aside className="hidden border-l border-dark-100 bg-dark-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/50 lg:block">
          {!selected || !customer ? <div className="flex h-full items-center justify-center text-center"><div><UserCircle className="mx-auto h-9 w-9 text-dark-300 dark:text-slate-700" /><p className="mt-3 text-sm font-bold text-dark dark:text-white">Konteks pelanggan</p><p className="mt-1 text-xs leading-5 text-dark-500 dark:text-slate-400">Profil dan ringkasan finansial muncul setelah percakapan dipilih.</p></div></div> : <div className="space-y-4">
            <div className="rounded-2xl border border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserCircle className="h-6 w-6" /></div><div className="min-w-0"><p className="truncate font-black text-dark dark:text-white">{customer.name}</p><span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">{ROLE_LABELS[customer.role] || customer.role}</span></div></div><p className="mt-3 truncate text-xs text-dark-500 dark:text-slate-400">{customer.email}</p>{customer.phone && <p className="mt-1 text-xs text-dark-500 dark:text-slate-400">{customer.phone}</p>}<p className="mt-2 text-[10px] text-dark-400">Bergabung {formatDate(customer.createdAt)}</p><Link href={`/admin/customers/${customer.id}`} className="mt-3 flex items-center justify-between rounded-xl border border-dark-100 px-3 py-2.5 text-xs font-bold text-dark-700 hover:border-primary/20 hover:text-primary dark:border-slate-800 dark:text-slate-300">Buka profil pelanggan <ChevronRight className="h-4 w-4" /></Link></div>
            {finance && <div className="grid grid-cols-2 gap-2"><div className="rounded-2xl border border-dark-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase text-dark-400">Sudah dibayar</p><p className="mt-1 text-sm font-black text-green-600">Rp {Math.round(finance.paidTotal).toLocaleString("id-ID")}</p></div><div className="rounded-2xl border border-dark-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase text-dark-400">Piutang</p><p className="mt-1 text-sm font-black text-amber-600">Rp {Math.round(finance.outstanding).toLocaleString("id-ID")}</p></div></div>}
            <div className="rounded-2xl border border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><p className="font-bold text-dark dark:text-white">Pesanan terbaru</p><p className="text-[10px] text-dark-400">Maks. 8 terakhir</p></div><Link href="/admin/orders" className="text-[10px] font-black text-primary">Semua</Link></div><div className="mt-3 space-y-2">{(context.customerOrders || []).length === 0 ? <p className="text-xs text-dark-500 dark:text-slate-400">Belum ada pesanan.</p> : context.customerOrders.map((order) => <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-dark-50 px-3 py-2.5 dark:bg-slate-900"><div className="min-w-0"><p className="truncate text-xs font-black text-dark dark:text-white">{order.orderNumber}</p><p className="text-[10px] capitalize text-dark-400">{order.status.replaceAll("_", " ")}</p></div><div className="text-right"><p className="text-xs font-black text-dark dark:text-white">Rp {Math.round(Number(order.total)).toLocaleString("id-ID")}</p><p className={cn("text-[10px] font-bold", order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600")}>{order.paymentStatus === "paid" ? "Lunas" : "Belum lunas"}</p></div></Link>)}</div></div>
            {finance && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3.5 text-xs leading-5 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/20 dark:text-blue-200"><Banknote className="mb-1 h-4 w-4" />Gunakan konteks keuangan ini sebelum memberi informasi tentang pembayaran. Angka berasal dari transaksi yang sudah tercatat, bukan asumsi chat.</div>}
          </div>}
        </aside>
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Hapus pesan ini?" description="Pesan akan dihapus permanen." confirmLabel="Hapus" variant="danger" isLoading={isDeletingMsg} onConfirm={handleDeleteMessage} onCancel={() => setDeleteTarget(null)} />
      <ConfirmDialog open={confirmClearThread} title="Hapus percakapan ini?" description={`Seluruh riwayat percakapan dengan ${customer?.name || selected?.customerName || "pelanggan ini"} akan dihapus permanen dan tidak bisa dikembalikan.`} confirmLabel="Hapus Percakapan" variant="danger" isLoading={isClearingThread} onConfirm={handleClearThread} onCancel={() => setConfirmClearThread(false)} />
    </div>
  );
}

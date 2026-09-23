"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, ExternalLink, Loader2, MessageSquare, Package, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { SiteImage } from "@/components/ui/site-image";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Data = {
  customer: { id: string; name: string; email: string; phone: string | null; avatar: string | null; role: string; roleLabel: string; isActive: boolean; createdAt: string; };
  summary: { orderCount: number; totalSpend: number; outstanding: number; paidTotal: number; pendingVerification: number; unreadMessages: number; };
  recentOrders: Array<{ id: string; orderNumber: string; total: string; status: string; paymentStatus: string; createdAt: string }>;
  recentMessages: Array<{ id: string; content: string; isRead: boolean; isFromCustomer: boolean; createdAt: string; orderId: string | null; orderNumber: string | null }>;
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [toggleOpen, setToggleOpen] = React.useState(false);
  const [toggling, setToggling] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch(`/api/admin/customers/${params.id}`, { cache: "no-store" });
    const payload = await res.json();
    if (!res.ok || !payload.success) throw new Error(payload.error?.message || "Pelanggan tidak ditemukan");
    setData(payload);
    setLoading(false);
  }, [params.id]);

  React.useEffect(() => {
    // Intentional initial data fetch for a client-side detail screen; the callback owns async state updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async loader updates state from its network lifecycle.
    void load().catch(() => { setLoading(false); toast({ type: "error", title: "Profil pelanggan tidak dapat dimuat" }); });
  }, [load, toast]);

  const toggleActive = async () => {
    if (!data) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/customers/${data.customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !data.customer.isActive }) });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error?.message || "Gagal memperbarui akun");
      toast({ type: "success", title: data.customer.isActive ? "Pelanggan dinonaktifkan" : "Pelanggan diaktifkan" });
      await load();
    } catch (error) {
      toast({ type: "error", title: error instanceof Error ? error.message : "Gagal memperbarui akun" });
    } finally { setToggling(false); setToggleOpen(false); }
  };

  if (loading || !data) return <div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  const { customer, summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")}><ArrowLeft className="mr-2 h-4 w-4" /> Pelanggan</Button>
        <div className="flex flex-wrap gap-2"><Link href={`/admin/messages?customerId=${customer.id}`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-extrabold text-white hover:bg-primary-dark"><MessageSquare className="h-4 w-4" /> Buka Pesan</Link><Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-xl border border-dark-200 bg-white px-3.5 py-2.5 text-xs font-bold text-dark-600 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><ExternalLink className="h-4 w-4" /> Pesanan pelanggan</Link></div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="bg-gradient-to-r from-primary/[0.08] via-white to-white p-6 dark:from-primary/10 dark:via-slate-950 dark:to-slate-950 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-primary/10">{customer.avatar ? <SiteImage src={customer.avatar} alt={customer.name} width={64} height={64} className="h-16 w-16 object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-black text-primary">{customer.name.charAt(0).toUpperCase()}</div>}</div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-2xl font-black text-dark dark:text-white sm:text-3xl">{customer.name}</h1><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">{ROLE_LABELS[customer.role] || customer.role}</span><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black", customer.isActive ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300")}>{customer.isActive ? "Aktif" : "Nonaktif"}</span></div><p className="mt-1 truncate text-sm text-dark-500 dark:text-slate-400">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p><p className="mt-1 text-xs text-dark-400">Bergabung {formatDate(customer.createdAt)}</p></div>
            </div>
            <button type="button" onClick={() => customer.isActive ? setToggleOpen(true) : void toggleActive()} className={cn("inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-extrabold", customer.isActive ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/20" : "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:hover:bg-green-950/20")} disabled={toggling}>{customer.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{toggling ? "Memproses…" : customer.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            { label: "Pesanan", value: summary.orderCount, Icon: Package, iconText: "text-blue-600", iconBg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Total Belanja", value: summary.totalSpend, Icon: WalletCards, iconText: "text-primary", iconBg: "bg-primary/8" },
            { label: "Sudah Dibayar", value: summary.paidTotal, Icon: Banknote, iconText: "text-green-600", iconBg: "bg-green-50 dark:bg-green-950/30" },
            { label: "Sisa Tagihan", value: summary.outstanding, Icon: CreditCard, iconText: summary.outstanding > 0 ? "text-amber-600" : "text-green-600", iconBg: "bg-amber-50 dark:bg-amber-950/30" },
          ] satisfies Array<{ label: string; value: number; Icon: LucideIcon; iconText: string; iconBg: string }>
        ).map((card) => {
          const Icon = card.Icon;
          return (
            <div key={card.label} className="rounded-2xl border border-dark-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", card.iconBg)}>
                  <Icon className={cn("h-5 w-5", card.iconText)} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-dark-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-1 text-lg font-black text-dark dark:text-white">
                    {card.label === "Pesanan" ? card.value : formatCurrency(card.value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-dark-100 px-5 py-4 dark:border-slate-800"><div><h2 className="font-bold text-dark dark:text-white">Riwayat pesanan</h2><p className="text-xs text-dark-500 dark:text-slate-400">Order terhubung langsung ke pembayaran pelanggan.</p></div><Link href="/admin/orders" className="text-xs font-bold text-primary">Semua order</Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-dark-100 text-left dark:border-slate-800"><th className="px-5 py-3 text-xs font-bold text-dark-400">Order</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Tanggal</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Status</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Pembayaran</th><th className="px-5 py-3 text-right text-xs font-bold text-dark-400">Total</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id} className="border-b border-dark-50 last:border-0 dark:border-slate-900"><td className="px-5 py-3.5"><Link href={`/admin/orders/${order.id}`} className="font-bold text-primary hover:underline">{order.orderNumber}</Link></td><td className="px-5 py-3.5 text-xs text-dark-500 dark:text-slate-400">{formatDate(order.createdAt)}</td><td className="px-5 py-3.5 text-xs font-semibold capitalize text-dark-600 dark:text-slate-300">{order.status.replaceAll("_", " ")}</td><td className="px-5 py-3.5"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black", order.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>{order.paymentStatus === "paid" ? "Lunas" : "Belum lunas"}</span></td><td className="px-5 py-3.5 text-right font-black text-dark dark:text-white">{formatCurrency(Number(order.total))}</td></tr>)}</tbody></table></div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-dark-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="font-bold text-dark dark:text-white">Status layanan</h2></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-dark-50 p-3 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase text-dark-400">Pesan belum dibaca</p><p className="mt-1 text-xl font-black text-dark dark:text-white">{summary.unreadMessages}</p></div><div className="rounded-xl bg-dark-50 p-3 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase text-dark-400">Verifikasi transfer</p><p className="mt-1 text-sm font-black text-violet-600">{formatCurrency(summary.pendingVerification)}</p></div></div><Link href={`/admin/messages?customerId=${customer.id}`} className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.04] px-3.5 py-3 text-xs font-extrabold text-primary hover:bg-primary/[0.08]"><span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Buka customer service</span><ExternalLink className="h-3.5 w-3.5" /></Link></section>

          <section className="rounded-2xl border border-dark-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><h2 className="font-bold text-dark dark:text-white">Aktivitas pesan</h2><div className="mt-3 space-y-2">{data.recentMessages.length === 0 ? <p className="text-xs text-dark-500 dark:text-slate-400">Belum ada pesan.</p> : data.recentMessages.slice(0, 6).map((message) => <div key={message.id} className="rounded-xl bg-dark-50 p-3 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-dark-400">{message.isFromCustomer ? "Pelanggan" : "Tim"} · {formatDate(message.createdAt)}{message.orderNumber ? ` · ${message.orderNumber}` : ""}</span><span className={cn("text-[10px] font-bold", message.isRead ? "text-green-600" : "text-amber-600")}>{message.isRead ? "Dibaca" : "Belum dibaca"}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-dark-700 dark:text-slate-300">{message.content}</p></div>)}</div></section>
        </div>
      </div>

      <ConfirmDialog open={toggleOpen} variant="danger" title={`Nonaktifkan ${customer.name}?`} description="Pelanggan ini tidak dapat login atau membuat pesanan sampai diaktifkan kembali." confirmLabel="Nonaktifkan" cancelLabel="Batal" isLoading={toggling} onConfirm={() => void toggleActive()} onCancel={() => setToggleOpen(false)} />
    </div>
  );
}

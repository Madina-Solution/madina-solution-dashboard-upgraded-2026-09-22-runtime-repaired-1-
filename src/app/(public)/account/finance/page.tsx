"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, FileText, Loader2, ReceiptText, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatCurrency, cn } from "@/lib/utils";

type FinanceData = {
  summary: { billedTotal: number; paidTotal: number; outstanding: number; pendingVerification: number };
  orders: Array<{ id: string; orderNumber: string; total: string; paymentStatus: string; status: string; createdAt: string }>;
  payments: Array<{ id: string; orderId: string; orderNumber: string; amount: string; currency: string; status: string; paymentMethod: string | null; reference: string | null; paidAt: string | null; createdAt: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function paymentLabel(status: string) {
  if (status === "paid") return "Lunas";
  if (status === "pending_verification") return "Menunggu verifikasi";
  if (status === "refunded") return "Dikembalikan";
  return "Menunggu pembayaran";
}

export default function AccountFinancePage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<FinanceData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/account/finance")
      .then((response) => response.json())
      .then((result) => { if (result.success) setData(result); })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"><WalletCards className="h-4 w-4" /> Ringkasan Keuangan <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] tracking-normal text-primary">{ROLE_LABELS[user.role] || user.role}</span></div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-dark dark:text-white">Pembayaran & transaksi pribadi</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-dark-500 dark:text-slate-400">Semua transaksi yang terkait dengan akun <strong className="text-dark dark:text-white">{user.name}</strong> ditampilkan di sini. Data mengikuti pesanan dan pembayaran yang tercatat di sistem.</p>
      </div>

      {loading || !data ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                { label: "Total Tagihan", value: data.summary.billedTotal, Icon: FileText, iconText: "text-blue-600", iconBg: "bg-blue-50 dark:bg-blue-950/30" },
                { label: "Sudah Dibayar", value: data.summary.paidTotal, Icon: ArrowDownLeft, iconText: "text-green-600", iconBg: "bg-green-50 dark:bg-green-950/30" },
                { label: "Sisa Tagihan", value: data.summary.outstanding, Icon: ArrowUpRight, iconText: data.summary.outstanding > 0 ? "text-amber-600" : "text-primary", iconBg: "bg-amber-50 dark:bg-amber-950/30" },
                { label: "Verifikasi Berjalan", value: data.summary.pendingVerification, Icon: Banknote, iconText: "text-violet-600", iconBg: "bg-violet-50 dark:bg-violet-950/30" },
              ] satisfies Array<{ label: string; value: number; Icon: LucideIcon; iconText: string; iconBg: string }>
            ).map((card) => {
              const Icon = card.Icon;
              return (
                <div key={card.label} className="rounded-2xl border border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", card.iconBg)}>
                      <Icon className={cn("h-5 w-5", card.iconText)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark-500 dark:text-slate-400">{card.label}</p>
                      <p className="mt-1 text-lg font-black text-dark dark:text-white">{formatCurrency(card.value)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="overflow-hidden rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-2 border-b border-dark-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-dark dark:text-white">Riwayat pembayaran</h3><p className="text-xs text-dark-500 dark:text-slate-400">Status pembayaran terhubung langsung ke pesanan.</p></div><Link href="/account/orders" className="text-xs font-bold text-primary hover:underline">Lihat semua pesanan</Link></div>
            {data.payments.length === 0 ? <div className="px-5 py-14 text-center text-sm text-dark-500 dark:text-slate-400">Belum ada transaksi pembayaran.</div> : <div className="divide-y divide-dark-50 dark:divide-slate-900">{data.payments.map((payment) => <Link key={payment.id} href={`/account/orders/${payment.orderId}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-dark-50/60 dark:hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dark-50 text-dark-500 dark:bg-slate-900 dark:text-slate-300"><ReceiptText className="h-4 w-4" /></div><div className="min-w-0"><p className="font-bold text-dark dark:text-white">{payment.orderNumber}</p><p className="truncate text-xs text-dark-500 dark:text-slate-400">{formatDate(payment.paidAt || payment.createdAt)} · {payment.paymentMethod || "Pembayaran"}{payment.reference ? ` · ${payment.reference}` : ""}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold", payment.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : payment.status === "pending_verification" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-dark-100 text-dark-600 dark:bg-slate-800 dark:text-slate-300")}>{paymentLabel(payment.status)}</span><span className="font-black text-dark dark:text-white">{formatCurrency(Number(payment.amount))}</span></div></Link>)}</div>}
          </section>

          <section className="overflow-hidden rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-dark-100 px-5 py-4 dark:border-slate-800"><h3 className="font-bold text-dark dark:text-white">Status pesanan & tagihan</h3><p className="text-xs text-dark-500 dark:text-slate-400">Satu tampilan untuk melihat pekerjaan dan kewajiban pembayaran.</p></div>
            {data.orders.length === 0 ? <div className="px-5 py-14 text-center text-sm text-dark-500 dark:text-slate-400">Belum ada pesanan.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-dark-100 text-left dark:border-slate-800"><th className="px-5 py-3 text-xs font-bold text-dark-400">Pesanan</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Tanggal</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Status</th><th className="px-5 py-3 text-xs font-bold text-dark-400">Pembayaran</th><th className="px-5 py-3 text-right text-xs font-bold text-dark-400">Total</th></tr></thead><tbody>{data.orders.map((order) => <tr key={order.id} className="border-b border-dark-50 last:border-0 dark:border-slate-900"><td className="px-5 py-3.5"><Link href={`/account/orders/${order.id}`} className="font-bold text-primary hover:underline">{order.orderNumber}</Link></td><td className="px-5 py-3.5 text-xs text-dark-500 dark:text-slate-400">{formatDate(order.createdAt)}</td><td className="px-5 py-3.5 text-xs font-semibold capitalize text-dark-600 dark:text-slate-300">{order.status.replaceAll("_", " ")}</td><td className="px-5 py-3.5"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold", order.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300")}>{order.paymentStatus === "paid" ? "Lunas" : "Belum Lunas"}</span></td><td className="px-5 py-3.5 text-right font-black text-dark dark:text-white">{formatCurrency(Number(order.total))}</td></tr>)}</tbody></table></div>}
          </section>

          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/20 dark:text-blue-200"><CreditCard className="h-4 w-4 shrink-0" />Status keuangan akun mengikuti pembayaran yang dikonfirmasi sistem; upload bukti transfer tidak otomatis dianggap lunas sebelum diverifikasi.</div>
        </>
      )}
    </div>
  );
}

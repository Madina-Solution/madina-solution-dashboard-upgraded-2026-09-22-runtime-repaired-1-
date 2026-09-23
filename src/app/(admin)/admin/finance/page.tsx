"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CalendarDays, Download, Landmark, Plus, ReceiptText, RefreshCcw, ShieldCheck, WalletCards, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";

 type FinanceCategory = { id: string; name: string; type: string; isActive: boolean; sortOrder: number };
 type FinanceTransaction = { id: string; type: string; status: string; categoryName: string | null; orderNumber: string | null; reference: string | null; description: string; amount: string; currency: string; paymentMethod: string | null; transactionDate: string; notes: string | null; customerId: string | null; customerName: string | null; customerEmail: string | null; customerRole: string | null };
 type FinanceData = { period: { month: string }; summary: { income: number; expense: number; net: number; outstanding: number; pendingVerification: number; pendingVerificationAmount: number }; categories: FinanceCategory[]; transactions: FinanceTransaction[] };

function currentMonth() { return new Date().toISOString().slice(0, 7); }

export default function AdminFinancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [month, setMonth] = React.useState(currentMonth());
  const [data, setData] = React.useState<FinanceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ categoryId: "", description: "", amount: "", transactionDate: new Date().toISOString().slice(0, 10), paymentMethod: "", reference: "", notes: "" });
  const [transactionSearch, setTransactionSearch] = React.useState("");
  const [transactionType, setTransactionType] = React.useState<"all" | "income" | "expense">("all");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/finance?month=${encodeURIComponent(month)}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Gagal memuat keuangan");
      setData(json);
      if (json.categories?.length) {
        setForm((current) => current.categoryId
          ? current
          : {
              ...current,
              categoryId: json.categories.find((c: FinanceCategory) => c.type === "expense" || c.type === "both")?.id || json.categories[0].id,
            });
      }
    } catch (error) {
      toast({ type: "error", title: "Keuangan tidak dapat dimuat", description: error instanceof Error ? error.message : undefined });
    } finally { setLoading(false); }
  }, [month, toast]);

  React.useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
  }, [load]);

  const addExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "expense", ...form, amount: Number(form.amount) }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Gagal menyimpan transaksi");
      toast({ type: "success", title: "Pengeluaran dicatat" });
      setShowForm(false);
      setForm((current) => ({ ...current, description: "", amount: "", reference: "", notes: "" }));
      await load();
    } catch (error) {
      toast({ type: "error", title: "Gagal mencatat pengeluaran", description: error instanceof Error ? error.message : undefined });
    } finally { setSaving(false); }
  };

  const exportCsv = () => {
    if (!data) return;
    const header = ["Tanggal","Jenis","Kategori","Pelanggan","Referensi","Deskripsi","Metode","Jumlah","Status"];
    const rows = filteredTransactions.map((t) => [new Date(t.transactionDate).toLocaleDateString("id-ID"), t.type, t.categoryName || "", t.customerName || "", t.reference || "", t.description, t.paymentMethod || "", t.amount, t.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `madina-keuangan-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const expenseCategories = data?.categories.filter((category) => category.type === "expense" || category.type === "both") || [];
  const canManageFinance = !!user && hasPermission(user.role, "finance.manage");
  const filteredTransactions = data
    ? data.transactions.filter((transaction) => {
        if (transactionType !== "all" && transaction.type !== transactionType) return false;
        const query = transactionSearch.trim().toLowerCase();
        if (!query) return true;
        return [transaction.description, transaction.customerName || "", transaction.customerEmail || "", transaction.orderNumber || "", transaction.reference || "", transaction.categoryName || ""].some((value) => value.toLowerCase().includes(query));
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Finance & Ledger</p><h1 className="mt-1 text-2xl font-bold text-dark dark:text-white">Keuangan</h1><p className="mt-1 max-w-2xl text-sm text-dark-500 dark:text-slate-400">Arus kas berbasis transaksi: pemasukan otomatis dari pembayaran terkonfirmasi dan pengeluaran dicatat secara terkontrol.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" /><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 rounded-xl border border-dark-200 bg-white pl-9 pr-3 text-sm font-semibold text-dark outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4" /> Export CSV</Button>
          {canManageFinance && <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> Catat Pengeluaran</Button>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={addExpense} className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-5 dark:border-primary/20 dark:bg-primary/5">
          <div className="flex items-center gap-3"><ReceiptText className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-dark dark:text-white">Catat Pengeluaran</h2><p className="text-xs text-dark-500 dark:text-slate-400">Transaksi manual masuk sebagai posted dan tidak mengubah order.</p></div></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Kategori</label><select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-3 text-sm text-dark outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Nominal</label><Input required type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Tanggal</label><Input required type="date" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Metode</label><Input value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} placeholder="Kas / Bank / E-wallet" /></div>
            <div className="md:col-span-2 xl:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Deskripsi</label><Input required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Contoh: Beli tinta printer A3" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Referensi</label><Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Nota / nomor bukti" /></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-dark-600 dark:text-slate-300">Catatan</label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan internal" /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button><Button type="submit" isLoading={saving}>Simpan Transaksi</Button></div>
        </form>
      )}

      {loading || !data ? <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950"><RefreshCcw className="h-6 w-6 animate-spin text-dark-400" /></div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {([
              ["Pemasukan", data.summary.income, ArrowDownLeft, "text-green-600", "bg-green-50"],
              ["Pengeluaran", data.summary.expense, ArrowUpRight, "text-red-600", "bg-red-50"],
              ["Arus Bersih", data.summary.net, WalletCards, data.summary.net >= 0 ? "text-primary" : "text-red-600", data.summary.net >= 0 ? "bg-primary/10" : "bg-red-50"],
              ["Piutang Order", data.summary.outstanding, Banknote, "text-amber-600", "bg-amber-50"],
              ["Menunggu Verifikasi", data.summary.pendingVerification, ShieldCheck, "text-blue-600", "bg-blue-50"],
            ] as Array<[string, number, LucideIcon, string, string]>).map(([label, value, Icon, iconClass, iconBg]) => (
              <div key={label} className="rounded-2xl border border-dark-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-dark-500 dark:text-slate-400">{label}</p>
                    <p className="mt-1 truncate text-lg font-bold text-dark dark:text-white">{label === "Menunggu Verifikasi" ? `${String(value)} pembayaran` : formatCurrency(value)}</p>
                    {label === "Menunggu Verifikasi" && data.summary.pendingVerificationAmount > 0 && <p className="mt-0.5 text-[10px] font-semibold text-violet-600">Nilai pending {formatCurrency(data.summary.pendingVerificationAmount)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 border-b border-dark-100 px-5 py-4 dark:border-slate-800"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-dark dark:text-white">Buku Kas</h2><p className="text-xs text-dark-500 dark:text-slate-400">Periode {data.period.month} · {filteredTransactions.length} transaksi ditampilkan</p></div><div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-dark-400" /><span className="text-xs text-dark-500 dark:text-slate-400">Pemasukan pembayaran tidak bisa dihapus manual.</span></div></div><div className="grid gap-2 sm:grid-cols-[1fr_150px]"><Input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Cari pelanggan, order, kategori, referensi…" aria-label="Cari transaksi keuangan" /><select value={transactionType} onChange={(event) => setTransactionType(event.target.value as "all" | "income" | "expense")} className="h-10 rounded-xl border border-dark-200 bg-white px-3 text-sm font-semibold text-dark outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><option value="all">Semua transaksi</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div></div>
            {filteredTransactions.length === 0 ? <div className="px-5 py-14 text-center text-sm text-dark-500">Tidak ada transaksi yang cocok dengan filter.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left dark:border-slate-800"><th className="px-5 py-3 text-xs font-semibold text-dark-500">Tanggal</th><th className="px-5 py-3 text-xs font-semibold text-dark-500">Kategori</th><th className="px-5 py-3 text-xs font-semibold text-dark-500">Deskripsi</th><th className="px-5 py-3 text-xs font-semibold text-dark-500">Pelanggan</th><th className="px-5 py-3 text-xs font-semibold text-dark-500">Referensi</th><th className="px-5 py-3 text-right text-xs font-semibold text-dark-500">Jumlah</th><th className="px-5 py-3 text-xs font-semibold text-dark-500">Status</th></tr></thead><tbody>{filteredTransactions.map((transaction) => <tr key={transaction.id} className="border-b border-dark-50 last:border-0 dark:border-slate-900"><td className="px-5 py-3.5 text-xs text-dark-500">{formatDate(new Date(transaction.transactionDate))}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${transaction.type === "income" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{transaction.categoryName || transaction.type}</span></td><td className="max-w-[320px] px-5 py-3.5"><p className="font-medium text-dark dark:text-white">{transaction.description}</p>{transaction.paymentMethod && <p className="mt-0.5 text-xs text-dark-400">{transaction.paymentMethod}</p>}</td><td className="px-5 py-3.5"><div className="min-w-[190px]">{transaction.customerId ? <Link href={`/admin/customers/${transaction.customerId}`} className="text-xs font-bold text-dark hover:text-primary dark:text-white dark:hover:text-primary">{transaction.customerName || "Pelanggan"}</Link> : <p className="text-xs font-bold text-dark dark:text-white">Transaksi internal</p>}{transaction.customerId && <p className="mt-0.5 text-[10px] text-dark-400">{ROLE_LABELS[transaction.customerRole || "customer"] || transaction.customerRole || "customer"}{transaction.customerEmail ? ` · ${transaction.customerEmail}` : ""}</p>}{transaction.customerId && transaction.orderNumber && <p className="mt-0.5 text-[10px] text-dark-400">Order {transaction.orderNumber}</p>}</div></td><td className="px-5 py-3.5 text-xs text-dark-500">{transaction.reference || transaction.orderNumber || "—"}</td><td className={`px-5 py-3.5 text-right font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>{transaction.type === "income" ? "+" : "−"}{formatCurrency(Number(transaction.amount))}</td><td className="px-5 py-3.5 text-xs font-semibold capitalize text-dark-500">{transaction.status === "void" ? "Void" : "Posted"}</td></tr>)}</tbody></table></div>}
          </div>
          <p className="text-xs leading-5 text-dark-400 dark:text-slate-500">Catatan akuntansi: modul ini adalah <strong>cash ledger / arus kas operasional</strong>, bukan laporan laba-rugi berbasis akrual. Data tetap ditautkan ke order dan pembayaran untuk rekonsiliasi.</p>
          {!user || !["super_admin", "admin"].includes(user.role) ? null : <p className="text-xs text-dark-400">Butuh verifikasi pembayaran? Buka <Link href="/admin/orders" className="font-semibold text-primary hover:underline">Pesanan</Link> dan konfirmasi transaksi manual yang memiliki bukti transfer.</p>}
        </>
      )}
    </div>
  );
}

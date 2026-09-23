"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Users, Search, MessageSquare, ExternalLink } from "lucide-react";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

type Customer = { id: string; name: string; email: string; phone: string | null; avatar?: string | null; role: string; isActive: boolean; createdAt: string; orderCount: number; totalSpend: number };

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Customer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [deactivateTarget, setDeactivateTarget] = React.useState<Customer | null>(null);
  const [isToggling, setIsToggling] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) setItems(data.customers);
    } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setIsToggling(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !currentActive }) });
      if ((await res.json()).success) { toast({ type: "success", title: currentActive ? "Pelanggan dinonaktifkan" : "Pelanggan diaktifkan" }); await fetchData(); }
      else toast({ type: "error", title: "Gagal" });
    } finally {
      setIsToggling(false);
      setDeactivateTarget(null);
    }
  };

  // Deactivating a customer account is treated as a sensitive change and
  // requires explicit confirmation; re-activating is low-risk and instant.
  const handleToggleActive = (customer: Customer) => {
    if (customer.isActive) setDeactivateTarget(customer);
    else void toggleActive(customer.id, customer.isActive);
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || "").includes(q));
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-dark dark:text-white">Pelanggan</h1><p className="mt-1 text-dark-500 dark:text-slate-400">{filtered.length} pelanggan</p></div>
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
          <Input placeholder="Cari pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : filtered.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left dark:border-slate-800">
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Pelanggan</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Telepon</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Pesanan</th>
            <th className="px-5 py-3 text-right font-medium text-dark-500 dark:text-slate-400">Total Belanja</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Status</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Bergabung</th>
            <th className="px-5 py-3 text-right font-medium text-dark-500 dark:text-slate-400">Aksi</th>
          </tr></thead><tbody>{filtered.map((c) => (
            <tr key={c.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50 dark:border-slate-900 dark:hover:bg-slate-900/50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full bg-dark-50 dark:bg-slate-900">{c.avatar ? <SiteImage src={c.avatar} alt={c.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" /> : <MediaPlaceholder label="Avatar" className="h-full w-full" />}</div>
                  <div className="min-w-0"><Link href={`/admin/customers/${c.id}`} className="block truncate font-medium text-dark hover:text-primary dark:text-white">{c.name}</Link><div className="mt-0.5 flex items-center gap-2"><p className="truncate text-xs text-dark-400 dark:text-slate-500">{c.email}</p><span className="rounded-full bg-primary/8 px-1.5 py-0.5 text-[9px] font-extrabold text-primary dark:bg-primary/10">Pelanggan</span></div></div>
                </div>
              </td>
              <td className="px-5 py-3.5 text-dark-600 dark:text-slate-300">{c.phone || "—"}</td>
              <td className="px-5 py-3.5 text-dark-600 dark:text-slate-300">{c.orderCount}</td>
              <td className="px-5 py-3.5 text-right font-medium text-dark dark:text-white">{formatCurrency(c.totalSpend)}</td>
              <td className="px-5 py-3.5"><button type="button" aria-label={`${c.isActive ? "Nonaktifkan" : "Aktifkan"} pelanggan ${c.name}`} onClick={() => handleToggleActive(c)}><Badge variant={c.isActive ? "success" : "error"}>{c.isActive ? "Aktif" : "Nonaktif"}</Badge></button></td>
              <td className="px-5 py-3.5 text-xs text-dark-500 dark:text-slate-400">{formatDate(c.createdAt)}</td>
              <td className="px-5 py-3.5">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/messages?customerId=${c.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-dark-200 px-2.5 text-[11px] font-bold text-dark-600 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:text-slate-300" aria-label={`Pesan ${c.name}`}><MessageSquare className="h-3.5 w-3.5" /> Pesan</Link>
                  <Link href={`/admin/customers/${c.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-dark-200 text-dark-500 hover:border-primary/20 hover:text-primary dark:border-slate-700 dark:text-slate-300" aria-label={`Buka profil ${c.name}`} title="Buka profil"><ExternalLink className="h-3.5 w-3.5" /></Link>
                </div>
              </td>
            </tr>
          ))}</tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Users className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark dark:text-white">{search ? "Tidak ditemukan" : "Belum ada pelanggan"}</p></div>}
      </div>

      <ConfirmDialog
        open={!!deactivateTarget}
        variant="danger"
        title={`Nonaktifkan ${deactivateTarget?.name ?? "pelanggan ini"}?`}
        description="Pelanggan yang dinonaktifkan tidak dapat login atau berbelanja sampai diaktifkan kembali."
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        isLoading={isToggling}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => { if (deactivateTarget) void toggleActive(deactivateTarget.id, deactivateTarget.isActive); }}
      />
    </div>
  );
}

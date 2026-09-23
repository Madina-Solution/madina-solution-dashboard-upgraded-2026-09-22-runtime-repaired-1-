"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

type Coupon = { id: string; code: string; description: string | null; discountType: string; discountValue: string; minPurchase: string | null; maxDiscount: string | null; usageLimit: number | null; usageCount: number | null; startDate: string | null; endDate: string | null; isActive: boolean };

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", description: "", discountType: "percentage" as string, discountValue: "", minPurchase: "", maxDiscount: "", usageLimit: 0, endDate: "", isActive: true });

  const fetchData = React.useCallback(async () => { try { const r = await fetch("/api/admin/coupons"); const d = await r.json(); if (d.success) setItems(d.coupons); } catch {} finally { setIsLoading(false); } }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);
  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ code: "", description: "", discountType: "percentage", discountValue: "", minPurchase: "", maxDiscount: "", usageLimit: 0, endDate: "", isActive: true }); };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue.trim()) { toast({ type: "error", title: "Kode dan nilai diskon wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const payload = { ...form, usageLimit: form.usageLimit || undefined, endDate: form.endDate || undefined, minPurchase: form.minPurchase || undefined, maxDiscount: form.maxDiscount || undefined };
      const url = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Kupon diperbarui" : "Kupon dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => { if (!deleteTarget) return; setIsDeleting(true); try { const r = await fetch(`/api/admin/coupons/${deleteTarget.id}`, { method: "DELETE" }); if ((await r.json()).success) { toast({ type: "success", title: "Kupon dinonaktifkan" }); fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); } };
  const toggleActive = async (id: string, current: boolean) => { const res = await fetch(`/api/admin/coupons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) }); if ((await res.json()).success) { toast({ type: "success", title: "Status diperbarui" }); fetchData(); } };
  const startEdit = (c: Coupon) => { setForm({ code: c.code, description: c.description || "", discountType: c.discountType, discountValue: c.discountValue, minPurchase: c.minPurchase || "", maxDiscount: c.maxDiscount || "", usageLimit: c.usageLimit || 0, endDate: c.endDate ? c.endDate.split("T")[0] : "", isActive: c.isActive }); setEditId(c.id); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Kupon</h1><p className="mt-1 text-dark-500">{items.length} kupon</p></div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Kupon</Button>
      </div>
      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Kupon" : "Tambah Kupon"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kode *</label><Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="DISKON10" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Jenis Diskon</label>
              <select value={form.discountType} onChange={(e) => setForm(p => ({ ...p, discountType: e.target.value }))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm focus:border-primary focus:outline-none">
                <option value="percentage">Persentase (%)</option><option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Nilai Diskon *</label><Input value={form.discountValue} onChange={(e) => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === "percentage" ? "10" : "50000"} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Min. Pembelian</label><Input value={form.minPurchase} onChange={(e) => setForm(p => ({ ...p, minPurchase: e.target.value }))} placeholder="100000" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Maks. Diskon</label><Input value={form.maxDiscount} onChange={(e) => setForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="50000" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Batas Penggunaan</label><Input type="number" value={form.usageLimit} onChange={(e) => setForm(p => ({ ...p, usageLimit: parseInt(e.target.value) || 0 }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Berlaku Hingga</label><Input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Deskripsi</label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi kupon" /></div>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan" : "Simpan"}</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}
      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : items.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left">
            <th className="px-5 py-3 font-medium text-dark-500">Kode</th><th className="px-5 py-3 font-medium text-dark-500">Diskon</th><th className="px-5 py-3 font-medium text-dark-500">Penggunaan</th><th className="px-5 py-3 font-medium text-dark-500">Berlaku</th><th className="px-5 py-3 font-medium text-dark-500">Status</th><th className="px-5 py-3 font-medium text-dark-500">Aksi</th>
          </tr></thead><tbody>{items.map((c) => (
            <tr key={c.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50">
              <td className="px-5 py-3.5 font-mono font-semibold text-dark">{c.code}</td>
              <td className="px-5 py-3.5 text-dark-600">{c.discountType === "percentage" ? `${c.discountValue}%` : formatCurrency(Number(c.discountValue))}</td>
              <td className="px-5 py-3.5 text-dark-600">{c.usageCount || 0}/{c.usageLimit || "∞"}</td>
              <td className="px-5 py-3.5 text-xs text-dark-500">{c.endDate ? formatDate(c.endDate) : "Tanpa batas"}</td>
              <td className="px-5 py-3.5"><button type="button" aria-label={`${c.isActive ? "Nonaktifkan" : "Aktifkan"} kupon ${c.code}`} onClick={() => toggleActive(c.id, c.isActive)}><Badge variant={c.isActive ? "success" : "error"}>{c.isActive ? "Aktif" : "Nonaktif"}</Badge></button></td>
              <td className="px-5 py-3.5"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: c.id, code: c.code })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></td>
            </tr>
          ))}</tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Ticket className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada kupon</p></div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Nonaktifkan kupon "${deleteTarget?.code}"?`} confirmLabel="Nonaktifkan" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

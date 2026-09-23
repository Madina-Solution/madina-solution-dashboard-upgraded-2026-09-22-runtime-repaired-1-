"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

type ShippingMethod = {
  id: string;
  name: string;
  courier: string | null;
  cost: string;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM = { name: "", courier: "", cost: 0, estimatedDaysMin: 1, estimatedDaysMax: 3, isActive: true, sortOrder: 0 };

export default function AdminShippingMethodsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_FORM);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await fetch("/api/admin/shipping-methods");
      const d = await r.json();
      if (d.success) setItems(d.shippingMethods);
    } catch {} finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/shipping-methods");
        const d = await r.json();
        if (cancelled) return;
        if (d.success) setItems(d.shippingMethods);
      } catch {} finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const resetForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ type: "error", title: "Nama kurir wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/shipping-methods/${editId}` : "/api/admin/shipping-methods";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Metode pengiriman diperbarui" : "Metode pengiriman dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const r = await fetch(`/api/admin/shipping-methods/${deleteTarget.id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { toast({ type: "success", title: "Metode pengiriman dihapus" }); fetchData(); }
      else toast({ type: "error", title: d.error?.message || "Gagal menghapus (mungkin masih dipakai di pesanan lama)" });
    } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const startEdit = (m: ShippingMethod) => {
    setForm({ name: m.name, courier: m.courier || "", cost: Number(m.cost), estimatedDaysMin: m.estimatedDaysMin || 1, estimatedDaysMax: m.estimatedDaysMax || 3, isActive: m.isActive, sortOrder: m.sortOrder });
    setEditId(m.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Metode Pengiriman</h1>
          <p className="mt-1 text-dark-500">{items.length} kurir — ongkir dihitung otomatis di checkout saat &quot;Kirim ke Alamat&quot; dipilih</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Kurir</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Metode Pengiriman" : "Tambah Metode Pengiriman"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama Ditampilkan *</label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: JNE Reguler" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kurir/Catatan</label><Input value={form.courier} onChange={(e) => setForm((p) => ({ ...p, courier: e.target.value }))} placeholder="JNE, J&T, SiCepat, dll." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Ongkos Kirim (Rp) *</label><Input type="number" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1.5 block text-sm font-medium text-dark">Estimasi Min (hari)</label><Input type="number" value={form.estimatedDaysMin} onChange={(e) => setForm((p) => ({ ...p, estimatedDaysMin: parseInt(e.target.value) || 0 }))} /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-dark">Estimasi Max (hari)</label><Input type="number" value={form.estimatedDaysMax} onChange={(e) => setForm((p) => ({ ...p, estimatedDaysMax: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Urutan Tampil</label><Input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))} /></div>
            <label className="flex items-center gap-2 self-end pb-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" /><span className="text-sm text-dark-600">Aktif (tampil di checkout)</span></label>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>Simpan</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}

      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-dark-50">
            {items.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dark-50 text-dark-500"><Truck className="h-4 w-4" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark">{m.name}</span>
                      {!m.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-dark-500">{m.courier ? `${m.courier} · ` : ""}{formatCurrency(Number(m.cost))} · est. {m.estimatedDaysMin}-{m.estimatedDaysMax} hari</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: m.id, name: m.name })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16"><Truck className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada metode pengiriman</p></div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title={`Hapus metode "${deleteTarget?.name}"?`} confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

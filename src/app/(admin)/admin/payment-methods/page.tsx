"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Landmark, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";

type PaymentMethod = {
  id: string;
  type: "bank_transfer" | "gateway";
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  logo: string | null;
  instructions: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PaymentForm = {
  type: PaymentMethod["type"];
  name: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  logo: string;
  instructions: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: PaymentForm = { type: "bank_transfer", name: "", bankName: "", accountNumber: "", accountHolder: "", logo: "", instructions: "", isActive: true, sortOrder: 0 };

export default function AdminPaymentMethodsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState<PaymentForm>(EMPTY_FORM);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await fetch("/api/admin/payment-methods");
      const d = await r.json();
      if (d.success) setItems(d.paymentMethods);
    } catch {} finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/payment-methods");
        const d = await r.json();
        if (cancelled) return;
        if (d.success) setItems(d.paymentMethods);
      } catch {} finally { if (!cancelled) setIsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const resetForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ type: "error", title: "Nama metode wajib diisi" }); return; }
    if (form.type === "bank_transfer" && (!form.bankName.trim() || !form.accountNumber.trim())) {
      toast({ type: "error", title: "Nama bank dan nomor rekening wajib diisi" });
      return;
    }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/payment-methods/${editId}` : "/api/admin/payment-methods";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Metode pembayaran diperbarui" : "Metode pembayaran dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const r = await fetch(`/api/admin/payment-methods/${deleteTarget.id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) { toast({ type: "success", title: "Metode pembayaran dihapus" }); fetchData(); }
      else toast({ type: "error", title: d.error?.message || "Gagal menghapus (mungkin masih dipakai di pesanan lama)" });
    } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const startEdit = (m: PaymentMethod) => {
    setForm({ type: m.type, name: m.name, bankName: m.bankName || "", accountNumber: m.accountNumber || "", accountHolder: m.accountHolder || "", logo: m.logo || "", instructions: m.instructions || "", isActive: m.isActive, sortOrder: m.sortOrder });
    setEditId(m.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Metode Pembayaran</h1>
          <p className="mt-1 text-dark-500">{items.length} metode aktif/nonaktif — ditampilkan ke pelanggan saat checkout</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Metode</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">Tipe *</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PaymentMethod["type"] }))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm focus:border-primary focus:outline-none">
                <option value="bank_transfer">Transfer Bank Manual</option>
                <option value="gateway">Gateway Otomatis (VA/QRIS)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark">Nama Ditampilkan *</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Transfer BCA" />
            </div>
            {form.type === "bank_transfer" && (
              <>
                <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama Bank *</label><Input value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} placeholder="BCA, BRI, Mandiri, dll." /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-dark">Nomor Rekening *</label><Input value={form.accountNumber} onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-dark">Atas Nama</label><Input value={form.accountHolder} onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))} /></div>
                <div className="sm:col-span-2"><MediaUploader value={form.logo} onChange={(v) => setForm((p) => ({ ...p, logo: Array.isArray(v) ? v[0] || "" : v }))} purpose="site_logo" label="Logo Bank (opsional)" persist={editId ? { endpoint: `/api/admin/payment-methods/${editId}`, key: "logo", mode: "replace", method: "PATCH" } : undefined} /></div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-dark">Instruksi Tambahan (opsional)</label>
              <textarea value={form.instructions} onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} rows={3} placeholder="Contoh: konfirmasi transfer via WhatsApp admin setelah membayar." className="w-full rounded-xl border border-dark-200 px-4 py-3 text-sm placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dark-50 text-dark-500">
                    {m.type === "bank_transfer" ? <Landmark className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark">{m.name}</span>
                      {!m.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                    </div>
                    {m.type === "bank_transfer" && (
                      <p className="mt-1 text-sm text-dark-500">{m.bankName} · {m.accountNumber} a.n. {m.accountHolder || "-"}</p>
                    )}
                    {m.instructions && <p className="mt-1 text-xs text-dark-400 line-clamp-2">{m.instructions}</p>}
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
          <div className="flex flex-col items-center justify-center py-16"><Landmark className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada metode pembayaran</p></div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title={`Hapus metode "${deleteTarget?.name}"?`} confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

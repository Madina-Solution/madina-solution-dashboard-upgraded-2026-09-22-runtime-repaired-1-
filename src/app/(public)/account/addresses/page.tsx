"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";

type Address = { id: string; label: string | null; recipientName: string; phone: string; province: string; city: string; district: string | null; postalCode: string | null; address: string; isDefault: boolean | null };

export default function AddressesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = React.useState<Address[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ label: "Rumah", recipientName: "", phone: "", province: "", city: "", district: "", postalCode: "", address: "", isDefault: false });

  const fetchData = React.useCallback(async () => { try { const r = await fetch("/api/account/addresses"); const d = await r.json(); if (d.success) setItems(d.addresses); } catch {} finally { setIsLoading(false); } }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);
  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ label: "Rumah", recipientName: "", phone: "", province: "", city: "", district: "", postalCode: "", address: "", isDefault: false }); };

  const handleSave = async () => {
    if (!form.recipientName.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.province.trim()) { toast({ type: "error", title: "Lengkapi data alamat" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/account/addresses/${editId}` : "/api/account/addresses";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Alamat diperbarui" : "Alamat ditambahkan" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try { const r = await fetch(`/api/account/addresses/${deleteTarget}`, { method: "DELETE" }); if ((await r.json()).success) { toast({ type: "success", title: "Alamat dihapus" }); fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const startEdit = (a: Address) => { setForm({ label: a.label || "Rumah", recipientName: a.recipientName, phone: a.phone, province: a.province, city: a.city, district: a.district || "", postalCode: a.postalCode || "", address: a.address, isDefault: !!a.isDefault }); setEditId(a.id); setShowForm(true); };

  if (!user) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h2 className="text-2xl font-bold text-dark">Alamat Saya</h2><p className="mt-1 text-dark-500">Kelola alamat pengiriman</p></div>
        <Button className="shrink-0" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Alamat</Button>
      </div>

      {showForm && (
        <Card className="mt-6"><CardContent className="p-6">
          <h3 className="mb-4 font-semibold text-dark">{editId ? "Edit Alamat" : "Tambah Alamat"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Label</label><Input value={form.label} onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Rumah, Kantor, dll." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama Penerima *</label><Input value={form.recipientName} onChange={(e) => setForm(p => ({ ...p, recipientName: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Telepon *</label><Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xx" /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Alamat Lengkap *</label><Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Jl., RT/RW, No." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kecamatan</label><Input value={form.district} onChange={(e) => setForm(p => ({ ...p, district: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kota/Kabupaten *</label><Input value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Provinsi *</label><Input value={form.province} onChange={(e) => setForm(p => ({ ...p, province: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kode Pos</label><Input value={form.postalCode} onChange={(e) => setForm(p => ({ ...p, postalCode: e.target.value }))} /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm(p => ({ ...p, isDefault: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" /><span className="text-sm text-dark-600">Jadikan alamat utama</span></label>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan" : "Tambah"}</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}

      {isLoading ? <div className="mt-6 flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
      : items.length > 0 ? (
        <div className="mt-6 space-y-4">{items.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-dark">{a.label || "Alamat"}</span>{a.isDefault && <Badge variant="default">Utama</Badge>}</div>
                  <p className="mt-1 text-sm text-dark">{a.recipientName} · {a.phone}</p>
                  <p className="mt-0.5 text-sm text-dark-500">{a.address}</p>
                  <p className="text-sm text-dark-500">{[a.district, a.city, a.province].filter(Boolean).join(", ")} {a.postalCode || ""}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card className="mt-6"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="h-10 w-10 text-dark-300" /><h3 className="mt-4 font-semibold text-dark">Belum Ada Alamat</h3><p className="mt-1 text-sm text-dark-500">Tambahkan alamat pengiriman untuk checkout yang lebih cepat.</p>
        </CardContent></Card>
      )}
      <ConfirmDialog open={!!deleteTarget} title="Hapus alamat ini?" description="Alamat akan dihapus permanen." confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

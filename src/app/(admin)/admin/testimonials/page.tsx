"use client";
import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";

type Testimonial = { id: string; name: string; role: string | null; company: string | null; content: string; rating: number | null; isFeatured: boolean | null; avatar: string | null };

export default function AdminTestimonialsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ avatar: "", name: "", role: "", company: "", content: "", rating: 5, isFeatured: false });

  const fetchData = React.useCallback(async () => { try { const r = await fetch("/api/admin/testimonials"); const d = await r.json(); if (d.success) setItems(d.testimonials); } catch {} finally { setIsLoading(false); } }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);
  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ avatar: "", name: "", role: "", company: "", content: "", rating: 5, isFeatured: false }); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) { toast({ type: "error", title: "Nama dan testimoni wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/testimonials/${editId}` : "/api/admin/testimonials";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Testimoni diperbarui" : "Testimoni dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => { if (!deleteTarget) return; setIsDeleting(true); try { const r = await fetch(`/api/admin/testimonials/${deleteTarget.id}`, { method: "DELETE" }); if ((await r.json()).success) { toast({ type: "success", title: "Testimoni dihapus" }); fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); } };
  const startEdit = (t: Testimonial) => { setForm({ avatar: t.avatar || "", name: t.name, role: t.role || "", company: t.company || "", content: t.content, rating: t.rating || 5, isFeatured: !!t.isFeatured }); setEditId(t.id); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Testimoni</h1><p className="mt-1 text-dark-500">{items.length} testimoni</p></div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Testimoni</Button>
      </div>
      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Testimoni" : "Tambah Testimoni"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><MediaUploader value={form.avatar} onChange={(value) => setForm(p => ({ ...p, avatar: Array.isArray(value) ? value[0] || "" : value }))} purpose="testimonial_avatar" label="Avatar Testimoni" persist={editId ? { endpoint: `/api/admin/testimonials/${editId}`, key: "avatar", mode: "replace", method: "PATCH" } : undefined} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama *</label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Jabatan</label><Input value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))} placeholder="Owner, Manager, dll." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Perusahaan</label><Input value={form.company} onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Rating</label>
              <select value={form.rating} onChange={(e) => setForm(p => ({ ...p, rating: parseInt(e.target.value) }))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm focus:border-primary focus:outline-none">
                {[5,4,3,2,1].map(r => <option key={r} value={r}>{"★".repeat(r)} ({r})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><RichTextEditor label="Testimoni *" value={form.content} onChange={(content) => setForm(p => ({ ...p, content }))} minHeight={220} placeholder="Tulis testimoni pelanggan…" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" /><span className="text-sm text-dark-600">Tampilkan di homepage</span></label>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan" : "Simpan"}</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}
      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : items.length > 0 ? (
          <div className="divide-y divide-dark-50">{items.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-4">
                {t.avatar ? <SiteImage src={t.avatar} alt={t.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-dark-100" />}
                <div className="flex-1">
                <div className="flex items-center gap-2"><span className="font-medium text-dark">{t.name}</span>{t.company && <span className="text-sm text-dark-500">— {t.company}</span>}{t.isFeatured && <Badge variant="default">Featured</Badge>}</div>
                <div className="mt-1 flex gap-0.5">{Array.from({length:5}).map((_,i) => <Star key={i} className={`h-3.5 w-3.5 ${i < (t.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-dark-200"}`} />)}</div>
                <p className="mt-2 text-sm text-dark-600 line-clamp-2">{t.content}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(t)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: t.id, name: t.name })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
            </div>
          ))}</div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Quote className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada testimoni</p></div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Hapus testimoni dari "${deleteTarget?.name}"?`} confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

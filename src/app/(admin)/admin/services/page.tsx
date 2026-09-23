"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Briefcase, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { OptionsEditor } from "@/components/admin/options-editor";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";
import type { ProductOption } from "@/db/schema";

type Service = { id: string; translations?: { id?: { name?: string; shortDescription?: string; description?: string }; en?: { name?: string; shortDescription?: string; description?: string } }; name: string; slug: string; shortDescription: string | null; description: string | null; thumbnail: string | null; gallery: string[] | null; startingPrice: string | null; estimatedDays: number | null; isFeatured: boolean | null; isActive: boolean; options?: ProductOption[] | null; fulfillmentType: string };

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Service[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ thumbnail: "", gallery: [] as string[], name: "", slug: "", shortDescription: "", description: "", startingPrice: "", estimatedDays: 7, isFeatured: false, isActive: true, options: [] as ProductOption[], fulfillmentType: "physical", translations: { id: { name: "", shortDescription: "", description: "" }, en: { name: "", shortDescription: "", description: "" } } });
  const [languageTab, setLanguageTab] = React.useState<"id" | "en">("id");

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/admin/services"); const d = await r.json(); if (d.success) setItems(d.services); } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ thumbnail: "", gallery: [], name: "", slug: "", shortDescription: "", description: "", startingPrice: "", estimatedDays: 7, isFeatured: false, isActive: true, options: [], fulfillmentType: "physical", translations: { id: { name: "", shortDescription: "", description: "" }, en: { name: "", shortDescription: "", description: "" } } }); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast({ type: "error", title: "Nama dan slug wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/services/${editId}` : "/api/admin/services";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Layanan diperbarui" : "Layanan dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: "DELETE" });
      if ((await res.json()).success) { toast({ type: "success", title: "Layanan dinonaktifkan" }); fetchData(); }
    } catch { toast({ type: "error", title: "Gagal" }); } finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    const res = await fetch(`/api/admin/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: !value }) });
    if ((await res.json()).success) { toast({ type: "success", title: "Diperbarui" }); fetchData(); }
  };

  const startEdit = (s: Service) => {
    setForm({ thumbnail: s.thumbnail || "", gallery: Array.isArray(s.gallery) ? s.gallery : [], name: s.name, slug: s.slug, shortDescription: s.shortDescription || "", description: s.description || "", startingPrice: s.startingPrice || "", estimatedDays: s.estimatedDays || 7, isFeatured: !!s.isFeatured, isActive: s.isActive, options: Array.isArray(s.options) ? s.options : [], fulfillmentType: s.fulfillmentType || "physical", translations: { id: { name: s.translations?.id?.name || s.name, shortDescription: s.translations?.id?.shortDescription || s.shortDescription || "", description: s.translations?.id?.description || s.description || "" }, en: { name: s.translations?.en?.name || "", shortDescription: s.translations?.en?.shortDescription || "", description: s.translations?.en?.description || "" } } });
    setEditId(s.id); setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Layanan</h1><p className="mt-1 text-dark-500">{items.length} layanan</p></div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Layanan</Button>
      </div>

      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Layanan" : "Tambah Layanan"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-2xl border border-dark-100 bg-dark-50/40 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Content languages</p><p className="mt-1 text-xs text-dark-500">Konten layanan disimpan per bahasa di database.</p></div><div className="flex rounded-xl border border-dark-200 bg-white p-1"><button type="button" onClick={()=>setLanguageTab("id")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab==="id"?"bg-dark-900 text-white":"text-dark-500"}`}>ID</button><button type="button" onClick={()=>setLanguageTab("en")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab==="en"?"bg-dark-900 text-white":"text-dark-500"}`}>EN</button></div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-dark">{languageTab==="en"?"English name":"Nama Indonesia"}</label><Input value={form.translations[languageTab].name} onChange={e=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],name:e.target.value}}}))}/></div><div><label className="mb-1.5 block text-sm font-medium text-dark">{languageTab==="en"?"English short description":"Deskripsi singkat Indonesia"}</label><Input value={form.translations[languageTab].shortDescription} onChange={e=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],shortDescription:e.target.value}}}))}/></div></div></div>
            <div className="sm:col-span-2"><MediaUploader value={form.thumbnail} onChange={(value) => setForm(p => ({ ...p, thumbnail: Array.isArray(value) ? value[0] || "" : value }))} purpose="service_image" label="Thumbnail Layanan" allowVideo persist={editId ? { endpoint: `/api/admin/services/${editId}`, key: "thumbnail", mode: "replace", method: "PATCH" } : undefined} /><MediaUploader value={form.gallery} onChange={(value) => setForm(p => ({ ...p, gallery: Array.isArray(value) ? value : value ? [value] : [] }))} purpose="service_image" label="Gallery Layanan" multiple maxFiles={12} allowVideo persist={editId ? { endpoint: `/api/admin/services/${editId}`, key: "gallery", mode: "replace", method: "PATCH" } : undefined} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama *</label><Input value={form.name} onChange={(e) => { const n = e.target.value; setForm(p => ({ ...p, name: n, slug: editId ? p.slug : n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }} placeholder="Nama layanan" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Slug *</label><Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Harga Mulai</label><Input value={form.startingPrice} onChange={(e) => setForm(p => ({ ...p, startingPrice: e.target.value }))} placeholder="500000" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Estimasi (hari)</label><Input type="number" value={form.estimatedDays} onChange={(e) => setForm(p => ({ ...p, estimatedDays: parseInt(e.target.value) || 7 }))} /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Deskripsi Singkat</label><Input value={form.shortDescription} onChange={(e) => setForm(p => ({ ...p, shortDescription: e.target.value }))} placeholder="Deskripsi singkat layanan" /></div>
            <div className="sm:col-span-2">
              <RichTextEditor label="Deskripsi lengkap layanan" helpText="Konten rich text untuk halaman detail layanan." value={form.description} onChange={(description) => setForm(p => ({ ...p, description }))} minHeight={320} />
              <div className="mt-5 rounded-2xl border border-dark-100 bg-dark-50/40 p-4"><p className="mb-3 text-sm font-bold text-dark">English service content</p><RichTextEditor label="English service description" value={form.translations.en.description} onChange={(description)=>setForm(p=>({...p,translations:{...p.translations,en:{...p.translations.en,description}}}))} minHeight={280} placeholder="Write the English service description…"/></div>
              <div className="mt-5"><OptionsEditor value={form.options} onChange={(options) => setForm(p => ({ ...p, options }))} title="Spesifikasi layanan" description="Atur format brief, ukuran, paket, file referensi, dan pilihan lain yang hanya muncul untuk layanan ini." />
                <div className="mt-4 rounded-2xl border border-dark-100 bg-white p-4"><label className="mb-2 block text-sm font-semibold text-dark">Jenis pemenuhan</label><select value={form.fulfillmentType} onChange={(e) => setForm(p => ({ ...p, fulfillmentType: e.target.value }))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm"><option value="physical">Fisik</option><option value="digital">Digital</option><option value="hybrid">Hybrid</option></select></div>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" /><span className="text-sm text-dark-600">Unggulan</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" /><span className="text-sm text-dark-600">Aktif</span></label>
            </div>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan Perubahan" : "Simpan"}</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}

      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : items.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left">
            <th className="px-5 py-3 font-medium text-dark-500">Layanan</th>
            <th className="px-5 py-3 text-right font-medium text-dark-500">Harga Mulai</th>
            <th className="px-5 py-3 font-medium text-dark-500">Estimasi</th>
            <th className="px-5 py-3 font-medium text-dark-500">Status</th>
            <th className="px-5 py-3 font-medium text-dark-500">Aksi</th>
          </tr></thead><tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50">
                <td className="px-5 py-3.5"><p className="font-medium text-dark">{s.name}</p>{s.shortDescription && <p className="text-xs text-dark-400 line-clamp-1">{s.shortDescription}</p>}</td>
                <td className="px-5 py-3.5 text-right text-dark-600">{s.startingPrice ? formatCurrency(Number(s.startingPrice)) : "—"}</td>
                <td className="px-5 py-3.5 text-dark-600">{s.estimatedDays || 7} hari</td>
                <td className="px-5 py-3.5"><button type="button" aria-label={`${s.isActive ? "Nonaktifkan" : "Aktifkan"} layanan ${s.name}`} onClick={() => handleToggle(s.id, "isActive", s.isActive)}><Badge variant={s.isActive ? "success" : "error"}>{s.isActive ? "Aktif" : "Nonaktif"}</Badge></button></td>
                <td className="px-5 py-3.5"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: s.id, name: s.name })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Briefcase className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada layanan</p></div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Nonaktifkan "${deleteTarget?.name}"?`} description="Layanan akan dinonaktifkan." confirmLabel="Nonaktifkan" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

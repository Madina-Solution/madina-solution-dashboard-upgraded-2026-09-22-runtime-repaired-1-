"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";
import { useToast } from "@/components/ui/toast";
import { SiteImage } from "@/components/ui/site-image";

type PortfolioItem = { id: string; translations?: { id?: { title?: string; description?: string; category?: string; client?: string; tags?: string[] }; en?: { title?: string; description?: string; category?: string; client?: string; tags?: string[] } }; title: string; slug: string; description: string | null; category: string | null; client: string | null; thumbnail: string | null; images: string[] | null; isFeatured: boolean | null; isActive: boolean };

export default function AdminPortfolioPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ thumbnail: "", images: [] as string[], title: "", slug: "", description: "", category: "", client: "", isFeatured: false, isActive: true, translations: { id: { title: "", description: "", category: "", client: "" }, en: { title: "", description: "", category: "", client: "" } } });
  const [languageTab, setLanguageTab] = React.useState<"id" | "en">("id");

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/admin/portfolio"); const d = await r.json(); if (d.success) setItems(d.portfolio); } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const resetForm = () => { setShowForm(false); setEditId(null); setForm({ thumbnail: "", images: [], title: "", slug: "", description: "", category: "", client: "", isFeatured: false, isActive: true, translations: { id: { title: "", description: "", category: "", client: "" }, en: { title: "", description: "", category: "", client: "" } } }); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) { toast({ type: "error", title: "Judul dan slug wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/portfolio/${editId}` : "/api/admin/portfolio";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Portfolio diperbarui" : "Portfolio dibuat" }); resetForm(); fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try { const res = await fetch(`/api/admin/portfolio/${deleteTarget.id}`, { method: "DELETE" }); if ((await res.json()).success) { toast({ type: "success", title: "Portfolio dinonaktifkan" }); fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const startEdit = (p: PortfolioItem) => { setForm({ thumbnail: p.thumbnail || "", images: Array.isArray(p.images) ? p.images : [], title: p.title, slug: p.slug, description: p.description || "", category: p.category || "", client: p.client || "", isFeatured: !!p.isFeatured, isActive: p.isActive, translations: { id: { title: p.translations?.id?.title || p.title, description: p.translations?.id?.description || p.description || "", category: p.translations?.id?.category || p.category || "", client: p.translations?.id?.client || p.client || "" }, en: { title: p.translations?.en?.title || "", description: p.translations?.en?.description || "", category: p.translations?.en?.category || "", client: p.translations?.en?.client || "" } } }); setEditId(p.id); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Portfolio</h1><p className="mt-1 text-dark-500">{items.length} proyek</p></div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Portfolio</Button>
      </div>
      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Portfolio" : "Tambah Portfolio"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-2xl border border-dark-100 bg-dark-50/40 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Content languages</p><p className="mt-1 text-xs text-dark-500">Judul, ringkasan, kategori, dan klien dapat dilokalkan.</p></div><div className="flex rounded-xl border border-dark-200 bg-white p-1"><button type="button" onClick={()=>setLanguageTab("id")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab==="id"?"bg-dark-900 text-white":"text-dark-500"}`}>ID</button><button type="button" onClick={()=>setLanguageTab("en")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab==="en"?"bg-dark-900 text-white":"text-dark-500"}`}>EN</button></div></div><div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-dark">{languageTab==="en"?"English title":"Judul Indonesia"}</label><Input value={form.translations[languageTab].title} onChange={e=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],title:e.target.value}}}))}/></div><div><label className="mb-1.5 block text-sm font-medium text-dark">{languageTab==="en"?"English client":"Klien Indonesia"}</label><Input value={form.translations[languageTab].client} onChange={e=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],client:e.target.value}}}))}/></div></div></div>
            <div className="sm:col-span-2"><MediaUploader value={form.thumbnail} onChange={(value) => setForm(p => ({ ...p, thumbnail: Array.isArray(value) ? value[0] || "" : value }))} purpose="portfolio" label="Thumbnail Portfolio" allowVideo persist={editId ? { endpoint: `/api/admin/portfolio/${editId}`, key: "thumbnail", mode: "replace", method: "PATCH" } : undefined} /><MediaUploader value={form.images} onChange={(value) => setForm(p => ({ ...p, images: Array.isArray(value) ? value : value ? [value] : [] }))} purpose="portfolio" label="Gallery Portfolio" multiple maxFiles={20} allowVideo persist={editId ? { endpoint: `/api/admin/portfolio/${editId}`, key: "images", mode: "replace", method: "PATCH" } : undefined} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Judul *</label><Input value={form.title} onChange={(e) => { const t = e.target.value; setForm(p => ({ ...p, title: t, slug: editId ? p.slug : t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Slug *</label><Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kategori</label><Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Branding, Design, dll." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Klien</label><Input value={form.client} onChange={(e) => setForm(p => ({ ...p, client: e.target.value }))} /></div>
            <div className="sm:col-span-2"><RichTextEditor label="Deskripsi & studi kasus" helpText="Gunakan heading, list, tautan, gambar, dan tabel untuk studi kasus portfolio." value={form.description} onChange={(description) => setForm(p => ({ ...p, description }))} minHeight={300} /></div>
            <div className="mt-5"><RichTextEditor label="English case study" value={form.translations.en.description} onChange={(description)=>setForm(p=>({...p,translations:{...p.translations,en:{...p.translations.en,description}}}))} minHeight={280} placeholder="Write the English case study…"/></div>
            <div className="flex gap-4 sm:col-span-2">
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
            <th className="px-5 py-3 font-medium text-dark-500">Judul</th><th className="px-5 py-3 font-medium text-dark-500">Kategori</th><th className="px-5 py-3 font-medium text-dark-500">Klien</th><th className="px-5 py-3 font-medium text-dark-500">Status</th><th className="px-5 py-3 font-medium text-dark-500">Aksi</th>
          </tr></thead><tbody>{items.map((p) => (
            <tr key={p.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50">
              <td className="px-5 py-3.5"><div className="flex items-center gap-3">{p.thumbnail ? <SiteImage src={p.thumbnail} alt={p.title} width={56} height={42} className="h-10 w-14 rounded-lg object-cover" /> : <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-primary/10 to-dark-100" />}<span className="font-medium text-dark">{p.title}</span></div></td><td className="px-5 py-3.5 text-dark-600">{p.category || "—"}</td><td className="px-5 py-3.5 text-dark-600">{p.client || "—"}</td>
              <td className="px-5 py-3.5"><Badge variant={p.isActive ? "success" : "error"}>{p.isActive ? "Aktif" : "Nonaktif"}</Badge></td>
              <td className="px-5 py-3.5"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: p.id, title: p.title })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></td>
            </tr>
          ))}</tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><ImageIcon className="h-10 w-10 text-dark-300" aria-hidden="true" /><p className="mt-4 font-semibold text-dark">Belum ada portfolio</p></div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Nonaktifkan "${deleteTarget?.title}"?`} confirmLabel="Nonaktifkan" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

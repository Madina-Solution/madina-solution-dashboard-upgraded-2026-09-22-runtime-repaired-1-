"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, FileText, Eye, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";

type Article = {
  id: string; title: string; slug: string; excerpt: string | null; content: string | null; thumbnail: string | null; category: string | null;
  isPublished: boolean | null; publishedAt: string | null; createdAt: string; tags?: string[] | null;
  metadata?: { seo?: { title?: string; description?: string; keywords?: string[]; canonicalUrl?: string; noIndex?: boolean; ogImage?: string; ogTitle?: string; ogDescription?: string; twitterTitle?: string; twitterDescription?: string }; editorial?: { authorName?: string; authorRole?: string; authorBio?: string; authorCredentials?: string; readingTime?: number; featured?: boolean; allowComments?: boolean }; distribution?: { ctaTitle?: string; ctaText?: string; ctaLabel?: string; ctaHref?: string; newsletter?: boolean } };
  translations?: { id?: { title?: string; excerpt?: string; content?: string; category?: string; tags?: string[]; seo?: { title?: string; description?: string } }; en?: { title?: string; excerpt?: string; content?: string; category?: string; tags?: string[]; seo?: { title?: string; description?: string } } };
};

export default function AdminArticlesPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Article[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [languageTab, setLanguageTab] = React.useState<"id" | "en">("id");
  const [form, setForm] = React.useState({ thumbnail: "", title: "", slug: "", excerpt: "", content: "", category: "", tags: "", enTitle: "", enExcerpt: "", enContent: "", enCategory: "", enTags: "", isPublished: false, seoTitle: "", seoDescription: "", canonicalUrl: "", noIndex: false, ogImage: "", ogTitle: "", ogDescription: "", twitterTitle: "", twitterDescription: "", featured: false, authorName: "", authorRole: "", authorBio: "", authorCredentials: "", readingTime: 0, ctaTitle: "", ctaText: "", ctaLabel: "", ctaHref: "", newsletter: false });

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/admin/articles"); const d = await r.json(); if (d.success) setItems(d.articles); } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const resetForm = () => { setShowForm(false); setEditId(null); setLanguageTab("id"); setForm({ thumbnail: "", title: "", slug: "", excerpt: "", content: "", category: "", tags: "", enTitle: "", enExcerpt: "", enContent: "", enCategory: "", enTags: "", isPublished: false, seoTitle: "", seoDescription: "", canonicalUrl: "", noIndex: false, ogImage: "", ogTitle: "", ogDescription: "", twitterTitle: "", twitterDescription: "", featured: false, authorName: "", authorRole: "", authorBio: "", authorCredentials: "", readingTime: 0, ctaTitle: "", ctaText: "", ctaLabel: "", ctaHref: "", newsletter: false }); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) { toast({ type: "error", title: "Judul dan slug wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/articles/${editId}` : "/api/admin/articles";
      const res = await fetch(url, { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ thumbnail: form.thumbnail, title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content, category: form.category, tags: form.tags.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20), translations: { id: { title: form.title, excerpt: form.excerpt, content: form.content, category: form.category, tags: form.tags.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20), seo: { title: form.seoTitle, description: form.seoDescription } }, en: { title: form.enTitle, excerpt: form.enExcerpt, content: form.enContent, category: form.enCategory, tags: form.enTags.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20) } }, isPublished: form.isPublished, metadata: { seo: { title: form.seoTitle, description: form.seoDescription, canonicalUrl: form.canonicalUrl, noIndex: form.noIndex, ogImage: form.ogImage, ogTitle: form.ogTitle, ogDescription: form.ogDescription, twitterTitle: form.twitterTitle, twitterDescription: form.twitterDescription }, editorial: { featured: form.featured, authorName: form.authorName, authorRole: form.authorRole, authorBio: form.authorBio, authorCredentials: form.authorCredentials, readingTime: form.readingTime || undefined }, distribution: { ctaTitle: form.ctaTitle, ctaText: form.ctaText, ctaLabel: form.ctaLabel, ctaHref: form.ctaHref, newsletter: form.newsletter } } }) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: editId ? "Artikel diperbarui" : "Artikel dibuat" }); resetForm(); void fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try { const res = await fetch(`/api/admin/articles/${deleteTarget.id}`, { method: "DELETE" }); if ((await res.json()).success) { toast({ type: "success", title: "Artikel dihapus" }); void fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/articles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublished: !current }) });
    if ((await res.json()).success) { toast({ type: "success", title: current ? "Artikel di-unpublish" : "Artikel dipublish" }); fetchData(); }
  };

  const startEdit = (a: Article) => { setLanguageTab("id"); setForm({ thumbnail: a.thumbnail || "", title: a.title, slug: a.slug, excerpt: a.excerpt || "", content: a.content || "", category: a.category || "", tags: (a.tags || []).join(", "), enTitle: a.translations?.en?.title || "", enExcerpt: a.translations?.en?.excerpt || "", enContent: a.translations?.en?.content || "", enCategory: a.translations?.en?.category || "", enTags: (a.translations?.en?.tags || []).join(", "), isPublished: !!a.isPublished, seoTitle: a.metadata?.seo?.title || "", seoDescription: a.metadata?.seo?.description || "", canonicalUrl: a.metadata?.seo?.canonicalUrl || "", noIndex: !!a.metadata?.seo?.noIndex, ogImage: a.metadata?.seo?.ogImage || "", ogTitle: a.metadata?.seo?.ogTitle || "", ogDescription: a.metadata?.seo?.ogDescription || "", twitterTitle: a.metadata?.seo?.twitterTitle || "", twitterDescription: a.metadata?.seo?.twitterDescription || "", featured: !!a.metadata?.editorial?.featured, authorName: a.metadata?.editorial?.authorName || "", authorRole: a.metadata?.editorial?.authorRole || "", authorBio: a.metadata?.editorial?.authorBio || "", authorCredentials: a.metadata?.editorial?.authorCredentials || "", readingTime: a.metadata?.editorial?.readingTime || 0, ctaTitle: a.metadata?.distribution?.ctaTitle || "", ctaText: a.metadata?.distribution?.ctaText || "", ctaLabel: a.metadata?.distribution?.ctaLabel || "", ctaHref: a.metadata?.distribution?.ctaHref || "", newsletter: !!a.metadata?.distribution?.newsletter }); setEditId(a.id); setShowForm(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Artikel</h1><p className="mt-1 text-dark-500">{items.length} artikel</p></div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="mr-2 h-4 w-4" />Tambah Artikel</Button>
      </div>
      {showForm && (
        <Card><CardContent className="p-6">
          <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Artikel" : "Tambah Artikel"}</h2>
          <div className="mb-5 flex gap-2 rounded-xl border border-dark-100 bg-dark-50 p-1"><button type="button" onClick={() => setLanguageTab("id")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${languageTab === "id" ? "bg-white text-dark shadow-sm" : "text-dark-500"}`}>Bahasa Indonesia</button><button type="button" onClick={() => setLanguageTab("en")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold ${languageTab === "en" ? "bg-white text-dark shadow-sm" : "text-dark-500"}`}>English</button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><MediaUploader value={form.thumbnail} onChange={(value) => setForm(p => ({ ...p, thumbnail: Array.isArray(value) ? value[0] || "" : value }))} purpose="article_image" label="Featured Image" persist={editId ? { endpoint: `/api/admin/articles/${editId}`, key: "thumbnail", mode: "replace", method: "PATCH" } : undefined} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Judul *</label><Input value={languageTab === "en" ? form.enTitle : form.title} onChange={(e) => { const value = e.target.value; setForm(p => languageTab === "en" ? ({ ...p, enTitle: value }) : ({ ...p, title: value, slug: editId ? p.slug : value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Slug *</label><Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Kategori</label><Input value={languageTab === "en" ? form.enCategory : form.category} onChange={(e) => setForm(p => ({ ...p, ...(languageTab === "en" ? { enCategory: e.target.value } : { category: e.target.value }) }))} placeholder="Design, Printing, Business…" /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-dark">Tag</label><Input value={languageTab === "en" ? form.enTags : form.tags} onChange={(e) => setForm(p => ({ ...p, ...(languageTab === "en" ? { enTags: e.target.value } : { tags: e.target.value }) }))} placeholder="branding, UMKM, printing" /></div>
            <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Ringkasan</label><Input value={languageTab === "en" ? form.enExcerpt : form.excerpt} maxLength={1000} onChange={(e) => setForm(p => ({ ...p, ...(languageTab === "en" ? { enExcerpt: e.target.value } : { excerpt: e.target.value }) }))} placeholder="Ringkasan yang kuat untuk SERP, social preview, dan card blog" /></div>
            <div className="sm:col-span-2"><RichTextEditor label="Konten artikel" helpText="Editor rich text untuk heading, list, link, tabel, gambar, source HTML, dan konten panjang." value={languageTab === "en" ? form.enContent : form.content} onChange={(content) => setForm(p => ({ ...p, ...(languageTab === "en" ? { enContent: content } : { content }) }))} minHeight={420}/></div>
            <div className="sm:col-span-2 grid gap-4 rounded-2xl border border-dark-100 bg-dark-50/50 p-5 md:grid-cols-2">
              <div className="md:col-span-2 flex items-center gap-4"><div className="flex items-center gap-2 text-sm font-semibold text-dark"><Globe2 className="h-4 w-4 text-primary"/>SEO &amp; Discoverability</div><span className="text-xs text-dark-400">Kontrol metadata tanpa menyentuh kode.</span></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">SEO Title</label><Input maxLength={65} value={form.seoTitle} onChange={(e) => setForm(p=>({...p,seoTitle:e.target.value}))} placeholder="Judul untuk Google / social" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Canonical URL</label><Input value={form.canonicalUrl} onChange={(e) => setForm(p=>({...p,canonicalUrl:e.target.value}))} placeholder="https://madina…/blog/slug" /></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark">Meta Description</label><textarea maxLength={160} rows={3} value={form.seoDescription} onChange={(e) => setForm(p=>({...p,seoDescription:e.target.value}))} className="w-full rounded-xl border border-dark-200 bg-white p-3 text-sm" placeholder="Deskripsi ringkas yang relevan dan informatif"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">OG Title</label><Input value={form.ogTitle} onChange={(e) => setForm(p=>({...p,ogTitle:e.target.value}))}/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Twitter Title</label><Input value={form.twitterTitle} onChange={(e) => setForm(p=>({...p,twitterTitle:e.target.value}))}/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">OG Image</label><Input value={form.ogImage} onChange={(e) => setForm(p=>({...p,ogImage:e.target.value}))} placeholder="URL gambar sosial"/></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark">OG Description</label><textarea rows={2} value={form.ogDescription} onChange={(e) => setForm(p=>({...p,ogDescription:e.target.value}))} className="w-full rounded-xl border border-dark-200 bg-white p-3 text-sm"/></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark">Twitter Description</label><textarea rows={2} value={form.twitterDescription} onChange={(e) => setForm(p=>({...p,twitterDescription:e.target.value}))} className="w-full rounded-xl border border-dark-200 bg-white p-3 text-sm"/></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.noIndex} onChange={(e)=>setForm(p=>({...p,noIndex:e.target.checked}))}/><span>Jangan indeks artikel ini</span></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e)=>setForm(p=>({...p,featured:e.target.checked}))}/><span>Featured / editorial pick</span></label>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Nama penulis tampilan</label><Input value={form.authorName} onChange={(e)=>setForm(p=>({...p,authorName:e.target.value}))} placeholder="Madina Editorial Team"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Peran / jabatan penulis</label><Input value={form.authorRole} onChange={(e)=>setForm(p=>({...p,authorRole:e.target.value}))} placeholder="Creative Director / Editorial Lead"/></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark">Bio penulis</label><textarea rows={3} value={form.authorBio} onChange={(e)=>setForm(p=>({...p,authorBio:e.target.value}))} className="w-full rounded-xl border border-dark-200 bg-white p-3 text-sm" placeholder="Bio singkat yang membangun kredibilitas penulis"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Kredensial</label><Input value={form.authorCredentials} onChange={(e)=>setForm(p=>({...p,authorCredentials:e.target.value}))} placeholder="10+ tahun pengalaman desain"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">Reading time (menit)</label><Input type="number" min={0} value={form.readingTime} onChange={(e)=>setForm(p=>({...p,readingTime:Math.max(0,Number(e.target.value)||0)}))}/></div>
              <div className="md:col-span-2 mt-2 border-t border-dark-100 pt-4"><p className="text-xs font-bold uppercase tracking-[.16em] text-dark-500">Distribusi & CTA</p></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">CTA title</label><Input value={form.ctaTitle} onChange={(e)=>setForm(p=>({...p,ctaTitle:e.target.value}))} placeholder="Butuh bantuan profesional?"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">CTA label</label><Input value={form.ctaLabel} onChange={(e)=>setForm(p=>({...p,ctaLabel:e.target.value}))} placeholder="Konsultasi sekarang"/></div>
              <div className="md:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-dark">CTA text</label><textarea rows={2} value={form.ctaText} onChange={(e)=>setForm(p=>({...p,ctaText:e.target.value}))} className="w-full rounded-xl border border-dark-200 bg-white p-3 text-sm"/></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-dark">CTA URL</label><Input value={form.ctaHref} onChange={(e)=>setForm(p=>({...p,ctaHref:e.target.value}))} placeholder="/contact atau https://…"/></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.newsletter} onChange={(e)=>setForm(p=>({...p,newsletter:e.target.checked}))}/><span>Tampilkan integrasi newsletter</span></label>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-primary/15 bg-primary/5 p-4"><div><p className="font-semibold text-dark">Publication workflow</p><p className="text-xs text-dark-500">Pisahkan penulisan, review, dan publish saat diperlukan.</p></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm(p => ({ ...p, isPublished: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" />Publish</label></div>
          </div>
          <div className="mt-4 flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan Perubahan" : "Simpan"}</Button><Button variant="outline" onClick={resetForm}>Batal</Button></div>
        </CardContent></Card>
      )}
      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : items.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left">
            <th className="px-5 py-3 font-medium text-dark-500">Judul</th><th className="px-5 py-3 font-medium text-dark-500">Kategori</th><th className="px-5 py-3 font-medium text-dark-500">Status</th><th className="px-5 py-3 font-medium text-dark-500">Tanggal</th><th className="px-5 py-3 font-medium text-dark-500">Aksi</th>
          </tr></thead><tbody>{items.map((a) => (
            <tr key={a.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50">
              <td className="px-5 py-3.5"><p className="font-medium text-dark">{a.title}</p>{a.excerpt && <p className="text-xs text-dark-400 line-clamp-1">{a.excerpt}</p>}</td>
              <td className="px-5 py-3.5 text-dark-600">{a.category || "—"}</td>
              <td className="px-5 py-3.5"><button type="button" aria-label={`${a.isPublished ? "Jadikan draft" : "Terbitkan"} artikel ${a.title}`} onClick={() => togglePublish(a.id, !!a.isPublished)}><Badge variant={a.isPublished ? "success" : "warning"}>{a.isPublished ? "Terbit" : "Draft"}</Badge></button></td>
              <td className="px-5 py-3.5 text-xs text-dark-500">{formatDate(a.createdAt)}</td>
              <td className="px-5 py-3.5"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: a.id, title: a.title })}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></td>
            </tr>
          ))}</tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><FileText className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada artikel</p></div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Hapus "${deleteTarget?.title}"?`} description="Artikel akan dihapus permanen." confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

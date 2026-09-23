"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, FolderTree, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteImage } from "@/components/ui/site-image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  order: number | null;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({ name: "", slug: "", description: "", order: 0, image: "" });
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  React.useEffect(() => {
    void (async () => { await fetchCategories(); })();
  }, [fetchCategories]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({ type: "error", title: "Nama dan slug wajib diisi" });
      return;
    }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/categories/${editId}` : "/api/admin/categories";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: editId ? "Kategori diperbarui" : "Kategori dibuat" });
        setShowForm(false);
        setEditId(null);
        setFormData({ name: "", slug: "", description: "", order: 0, image: "" });
        fetchCategories();
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal menyimpan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditId(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description || "", order: cat.order || 0, image: cat.image || "" });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: "Kategori dinonaktifkan" });
        fetchCategories();
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: currentActive ? "Kategori dinonaktifkan" : "Kategori diaktifkan" });
        fetchCategories();
      }
    } catch { /* silent */ }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Kategori</h1>
          <p className="mt-1 text-dark-500">{categories.length} kategori</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: "", slug: "", description: "", order: 0, image: "" }); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Kategori" : "Tambah Kategori"}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><MediaUploader value={formData.image} onChange={(value) => setFormData(p => ({ ...p, image: Array.isArray(value) ? value[0] || "" : value }))} purpose="category_image" label="Gambar Kategori" persist={editId ? { endpoint: `/api/admin/categories/${editId}`, key: "image", mode: "replace", method: "PATCH" } : undefined} /></div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Nama *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: editId ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
                    }));
                  }}
                  placeholder="Nama kategori"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Slug *</label>
                <Input value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} placeholder="nama-kategori" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-dark">Deskripsi</label>
                <Input value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi singkat" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Urutan</label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} isLoading={isSaving}>{editId ? "Simpan Perubahan" : "Simpan"}</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-100 text-left">
                <th className="px-6 py-3 font-medium text-dark-500">Nama</th>
                <th className="px-6 py-3 font-medium text-dark-500">Slug</th>
                <th className="px-6 py-3 font-medium text-dark-500">Urutan</th>
                <th className="px-6 py-3 font-medium text-dark-500">Status</th>
                <th className="px-6 py-3 font-medium text-dark-500">Aksi</th>
              </tr></thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-dark-50 last:border-0">
                    <td className="px-6 py-3.5"><div className="flex items-center gap-3">{cat.image ? <SiteImage src={cat.image} alt={cat.name} width={44} height={32} className="h-8 w-11 rounded-lg object-cover" /> : <div className="h-8 w-11 rounded-lg bg-primary/5" />}<span className="font-medium text-dark">{cat.name}</span></div></td>
                    <td className="px-6 py-3.5 text-dark-500">/{cat.slug}</td>
                    <td className="px-6 py-3.5 text-dark-500">{cat.order}</td>
                    <td className="px-6 py-3.5">
                      <button onClick={() => handleToggleActive(cat.id, cat.isActive)}>
                        <Badge variant={cat.isActive ? "success" : "error"}>{cat.isActive ? "Aktif" : "Nonaktif"}</Badge>
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="h-10 w-10 text-dark-300" />
            <p className="mt-4 font-semibold text-dark">Belum ada kategori</p>
            <p className="mt-1 text-sm text-dark-500">Tambahkan kategori pertama untuk produk Anda.</p>
          </div>
        )}
      </div>
      <ConfirmDialog open={!!deleteTarget} title={`Nonaktifkan "${deleteTarget?.name}"?`} description="Kategori akan dinonaktifkan." confirmLabel="Nonaktifkan" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

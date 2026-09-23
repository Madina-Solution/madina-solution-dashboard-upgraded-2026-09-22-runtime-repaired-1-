"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, LayoutGrid, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NAV_ICON_MAP, NAV_ICON_LABELS } from "@/lib/nav-icons";
import { QUICK_NAV_ICON_KEYS, type QuickNavIcon } from "@/lib/navigation";

type NavGroup = "services" | "products" | "explore";
type NavItem = {
  id: string; group: NavGroup; name: string; href: string; icon: QuickNavIcon; description: string | null; sortOrder: number; isActive: boolean;
  translations?: { id?: { name?: string; description?: string | null }; en?: { name?: string; description?: string | null } };
};

const GROUP_TABS: { value: NavGroup; label: string; hint: string }[] = [
  { value: "services", label: "Layanan", hint: "Kolom pertama Mega Menu — jasa yang bisa dipesan langsung" },
  { value: "products", label: "Produk", hint: "Kolom kedua Mega Menu — kategori katalog produk" },
  { value: "explore", label: "Eksplor", hint: "Kolom ketiga Mega Menu — portfolio, artikel, & perusahaan" },
];

const ICON_OPTIONS = QUICK_NAV_ICON_KEYS.map((key) => ({ value: key, label: NAV_ICON_LABELS[key] }));

const emptyForm = { group: "services" as NavGroup, name: "", href: "", icon: "sparkles" as QuickNavIcon, description: "", enName: "", enDescription: "", sortOrder: 0, isActive: true };

export default function AdminNavigationPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<NavGroup>("services");
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [reorderingId, setReorderingId] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/navigation");
      const data = await res.json();
      if (data.success) setItems(data.items);
      else toast({ type: "error", title: data.error?.message || "Gagal memuat Mega Menu" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); }
    finally { setIsLoading(false); }
  }, [toast]);

  React.useEffect(() => { void (async () => { await fetchData(); })(); }, [fetchData]);

  const groupItems = React.useMemo(
    () => items.filter((item) => item.group === activeTab).sort((a, b) => a.sortOrder - b.sortOrder),
    [items, activeTab]
  );

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm, group: activeTab, sortOrder: groupItems.length }); setShowForm(true); };
  const openEdit = (item: NavItem) => {
    setEditId(item.id);
    setForm({ group: item.group, name: item.name, href: item.href, icon: item.icon, description: item.description || "", enName: item.translations?.en?.name || "", enDescription: item.translations?.en?.description || "", sortOrder: item.sortOrder, isActive: item.isActive });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.href.trim()) { toast({ type: "error", title: "Nama dan link wajib diisi" }); return; }
    if (!form.href.startsWith("/") && !form.href.startsWith("http")) { toast({ type: "error", title: "Link harus diawali / atau http" }); return; }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/navigation/${editId}` : "/api/admin/navigation";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: form.group, name: form.name, href: form.href, icon: form.icon, description: form.description.trim() || null, sortOrder: form.sortOrder, isActive: form.isActive, translations: { id: { name: form.name.trim(), description: form.description.trim() || null }, en: { name: form.enName.trim(), description: form.enDescription.trim() || null } } }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: editId ? "Menu diperbarui" : "Menu ditambahkan" });
        setShowForm(false); setEditId(null); setForm(emptyForm);
        await fetchData();
      } else toast({ type: "error", title: data.error?.message || "Gagal menyimpan" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/navigation/${deleteTarget}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: "Menu dihapus" }); await fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal menghapus" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); }
    finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const handleToggleActive = async (item: NavItem) => {
    try {
      const res = await fetch(`/api/admin/navigation/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
      const data = await res.json();
      if (data.success) await fetchData();
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); }
  };

  const handleReorder = async (item: NavItem, direction: "up" | "down") => {
    const idx = groupItems.findIndex((i) => i.id === item.id);
    const swapWith = direction === "up" ? groupItems[idx - 1] : groupItems[idx + 1];
    if (!swapWith) return;
    setReorderingId(item.id);
    try {
      await Promise.all([
        fetch(`/api/admin/navigation/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: swapWith.sortOrder }) }),
        fetch(`/api/admin/navigation/${swapWith.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: item.sortOrder }) }),
      ]);
      await fetchData();
    } catch { toast({ type: "error", title: "Gagal mengubah urutan" }); }
    finally { setReorderingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark">Mega Menu</h1>
          <p className="mt-1 text-dark-500">Atur isi Mega Menu (desktop) &amp; Menu (mobile) — keduanya memakai data yang sama, jadi otomatis konsisten.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Menu</Button>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-dark-100 bg-white p-1.5">
        {GROUP_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.value ? "bg-primary text-white shadow-sm" : "text-dark-500 hover:bg-dark-50"}`}
          >
            {tab.label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab.value ? "bg-white/20" : "bg-dark-100 text-dark-400"}`}>
              {items.filter((i) => i.group === tab.value).length}
            </span>
          </button>
        ))}
      </div>
      <p className="-mt-3 text-xs text-dark-400">{GROUP_TABS.find((t) => t.value === activeTab)?.hint}</p>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold text-dark">{editId ? "Edit Menu" : "Tambah Menu"}</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">Kolom Mega Menu *</label>
                  <Select value={form.group} onValueChange={(v) => setForm((p) => ({ ...p, group: v as NavGroup }))} options={GROUP_TABS.map((t) => ({ value: t.value, label: t.label }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark">Ikon *</label>
                  <Select value={form.icon} onValueChange={(v) => setForm((p) => ({ ...p, icon: v as QuickNavIcon }))} options={ICON_OPTIONS} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Nama Menu *</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Logo Design" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Link Tujuan *</label>
                <Input value={form.href} onChange={(e) => setForm((p) => ({ ...p, href: e.target.value }))} placeholder="/services/logo-design atau /products?category=banner" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Deskripsi singkat (opsional)</label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Muncul di bawah nama menu, khusus kolom Layanan & Eksplor" />
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary-50/40 p-4">
                <div className="flex items-center gap-2"><span className="text-xs font-bold uppercase tracking-[.16em] text-primary">English translation</span><span className="text-[11px] text-dark-400">Disimpan di database untuk locale English.</span></div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div><label className="mb-1.5 block text-sm font-medium text-dark">English menu name</label><Input value={form.enName} onChange={(e) => setForm((p) => ({ ...p, enName: e.target.value }))} placeholder="e.g. Logo Design" /></div>
                  <div><label className="mb-1.5 block text-sm font-medium text-dark">English description</label><Input value={form.enDescription} onChange={(e) => setForm((p) => ({ ...p, enDescription: e.target.value }))} placeholder="Short description" /></div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-dark">Pratinjau ikon:</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {React.createElement(NAV_ICON_MAP[form.icon], { className: "h-4 w-4" })}
                  </span>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-dark-300 text-primary" />
                  <span className="text-sm text-dark-600">Tampilkan di menu publik</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} isLoading={isSaving}>Simpan</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        ) : groupItems.length > 0 ? (
          <div className="divide-y divide-dark-50">
            {groupItems.map((item, idx) => {
              const Icon = NAV_ICON_MAP[item.icon] ?? LayoutGrid;
              return (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <GripVertical className="h-4 w-4 shrink-0 text-dark-200" />
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button disabled={idx === 0 || reorderingId === item.id} onClick={() => handleReorder(item, "up")} className="rounded p-0.5 text-dark-400 hover:bg-dark-50 hover:text-primary disabled:opacity-30" aria-label="Naikkan urutan"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button disabled={idx === groupItems.length - 1 || reorderingId === item.id} onClick={() => handleReorder(item, "down")} className="rounded p-0.5 text-dark-400 hover:bg-dark-50 hover:text-primary disabled:opacity-30" aria-label="Turunkan urutan"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4.5 w-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-dark">{item.name}</p>
                      {!item.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                    </div>
                    <p className="truncate text-xs text-dark-400">{item.href}{item.description ? ` — ${item.description}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <label className="mr-2 flex cursor-pointer items-center gap-1.5" title="Tampilkan di menu publik">
                      <input type="checkbox" checked={item.isActive} onChange={() => handleToggleActive(item)} className="h-4 w-4 rounded border-dark-300 text-primary" />
                    </label>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="h-10 w-10 text-dark-300" />
            <p className="mt-4 font-semibold text-dark">Belum ada menu di kolom ini</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Tambah Menu</Button>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Hapus menu ini?" description="Menu akan langsung hilang dari Mega Menu desktop maupun Menu mobile." confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

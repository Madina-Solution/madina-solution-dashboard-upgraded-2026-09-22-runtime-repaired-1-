"use client";

import * as React from "react";
import { File, ImageIcon, Loader2, Play, Search, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaUploader } from "@/components/ui/media-uploader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SiteImage } from "@/components/ui/site-image";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface MediaRow { id: string; filename: string; mimeType: string; size: number; url: string; purpose: string; visibility: string; createdAt: string; uploaderName: string | null; }

const PURPOSES = ["", "portfolio", "service_image", "product_image", "article_image", "content_image", "category_image", "testimonial_avatar", "site_hero", "site_logo", "order_asset", "customer_upload", "design_revision", "production_asset", "avatar"];

function formatSize(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; }
function isVideo(mime: string, url: string) { return mime.startsWith("video/") || /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(url); }

export default function AdminMediaPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<MediaRow[]>([]);
  const [q, setQ] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaRow | null>(null);
  const [uploadPurpose, setUploadPurpose] = React.useState<"portfolio" | "service_image" | "product_image" | "article_image" | "site_hero">("portfolio");

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", ...(q ? { q } : {}), ...(purpose ? { purpose } : {}) });
      const response = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal memuat media");
      setItems(data.media || []);
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal memuat media" }); }
    finally { setLoading(false); }
  }, [purpose, q, toast]);

  React.useEffect(() => { const t = window.setTimeout(() => void load(), 180); return () => window.clearTimeout(t); }, [load]);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal menghapus media");
      setDeleteTarget(null);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast({ type: "success", title: "Media dihapus" });
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menghapus media" }); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Asset Center</p><h1 className="mt-1 text-2xl font-bold text-dark">Media Manager</h1><p className="mt-1 text-sm text-dark-500">Kelola logo, hero, portfolio, produk, file kerja, dan aset pesanan dalam satu tempat.</p></div>
        <Button onClick={() => setShowUpload((v) => !v)}><Upload className="mr-2 h-4 w-4" />Upload Media</Button>
      </div>

      {showUpload && (
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-dark">Upload asset</h2>
              <p className="text-xs text-dark-500">Pilih purpose agar asset mudah ditata dan permission tetap terjaga.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)} aria-label="Tutup">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-dark-500">Purpose</label>
              <select value={uploadPurpose} onChange={(e) => setUploadPurpose(e.target.value as typeof uploadPurpose)} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-3 text-sm">
                <option value="portfolio">Portfolio</option>
                <option value="service_image">Layanan</option>
                <option value="product_image">Produk</option>
                <option value="article_image">Artikel</option><option value="content_image">Rich content</option>
                <option value="site_hero">Hero situs</option>
              </select>
            </div>
            <MediaUploader
              purpose={uploadPurpose}
              label="Asset baru"
              multiple
              maxFiles={20}
              allowVideo
              value={[]}
              onChange={() => {}}
              onUploaded={() => { void load(); }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau tipe file…" className="pl-9" /></div>
        <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="h-11 rounded-xl border border-dark-200 bg-white px-4 text-sm text-dark"><option value="">Semua purpose</option>{PURPOSES.filter(Boolean).map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}</select>
        <Button variant="outline" onClick={() => { setQ(""); setPurpose(""); }}>Reset</Button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Hapus "${deleteTarget?.filename || "media"}"?`}
        description="File akan dihapus dari media library dan storage. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Media"
        variant="danger"
        isLoading={!!deleting}
        onConfirm={() => { if (deleteTarget) void remove(deleteTarget.id); }}
        onCancel={() => { if (!deleting) setDeleteTarget(null); }}
      />

      <div className="rounded-3xl border border-dark-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between"><p className="text-sm font-semibold text-dark">{items.length} asset tampil</p>{loading && <Loader2 className="h-4 w-4 animate-spin text-dark-400" />}</div>
        {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"><div className="h-56 animate-pulse rounded-2xl bg-dark-50" /><div className="h-56 animate-pulse rounded-2xl bg-dark-50" /><div className="h-56 animate-pulse rounded-2xl bg-dark-50" /></div> : items.length === 0 ? <div className="py-16 text-center"><ImageIcon className="mx-auto h-10 w-10 text-dark-300" /><p className="mt-3 font-semibold text-dark">Belum ada asset yang cocok</p><p className="mt-1 text-sm text-dark-500">Upload media atau ubah filter pencarian.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((m) => <article key={m.id} className="group overflow-hidden rounded-2xl border border-dark-100 bg-white transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-premium">
          <div className="relative aspect-[4/3] overflow-hidden bg-dark-50">{isVideo(m.mimeType, m.url) ? <><video src={m.url} muted playsInline preload="metadata" className="h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/10"><span className="rounded-full bg-white/95 p-2 text-dark shadow"><Play className="h-4 w-4 fill-current" /></span></span></> : m.mimeType.startsWith("image/") ? <SiteImage src={m.url} alt={m.filename} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full flex-col items-center justify-center text-dark-400"><File className="h-10 w-10" /><span className="mt-2 text-xs">{m.mimeType || "File"}</span></div>}
            <div className="absolute left-3 top-3"><Badge variant="secondary" className="bg-white/95 text-dark-700 shadow-sm">{m.purpose.replace(/_/g, " ")}</Badge></div><button type="button" disabled={deleting === m.id} onClick={() => setDeleteTarget(m)} className="absolute right-3 top-3 rounded-xl bg-black/75 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600 disabled:opacity-60" aria-label="Hapus media"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="p-4"><p className="truncate text-sm font-semibold text-dark" title={m.filename}>{m.filename}</p><div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-dark-400"><span>{formatSize(m.size)}</span><span>{formatDate(new Date(m.createdAt))}</span></div><p className="mt-2 truncate text-xs text-dark-500">{m.uploaderName || "System"} · {m.visibility}</p></div>
        </article>)}</div>}
      </div>
    </div>
  );
}

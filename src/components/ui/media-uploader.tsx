"use client";
import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import { ImagePlus, Loader2, Upload, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaUploaderPurpose =
  | "order_asset"
  | "design_revision"
  | "customer_upload"
  | "production_asset"
  | "portfolio"
  | "avatar"
  | "product_image"
  | "service_image"
  | "category_image"
  | "article_image"
  | "content_image"
  | "testimonial_avatar"
  | "site_hero"
  | "site_logo";

type Props = {
  value?: string | string[] | null;
  onChange: (value: string | string[]) => void;
  purpose: MediaUploaderPurpose;
  label?: string;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  className?: string;
  helpText?: string;
  orderId?: string;
  revisionId?: string;
  visibility?: "private" | "public";
  allowVideo?: boolean;
  persist?: { endpoint: string; key: string; mode?: "replace" | "merge"; method?: "POST" | "PUT" | "PATCH" };
  onUploaded?: (media: { id: string; url: string; mimeType: string }) => void;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function MediaUploader({
  value,
  onChange,
  purpose,
  label = "Gambar",
  multiple = false,
  maxFiles = 8,
  accept,
  className,
  helpText,
  orderId,
  revisionId,
  visibility = "public",
  allowVideo = false,
  persist,
  onUploaded,
}: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const effectiveAccept = accept ?? (allowVideo ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/gif");

  const uploadFiles = async (files: FileList | File[]) => {
    setError(null);
    const selected = Array.from(files);
    if (!selected.length) return;
    if (selected.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("Setiap file maksimal 25 MB.");
      return;
    }
    if (selected.some((file) => !file.type.startsWith("image/") && !(allowVideo && file.type.startsWith("video/")))) {
      setError(allowVideo ? "Hanya file gambar atau video yang dapat digunakan." : "Hanya file gambar yang dapat digunakan di field ini.");
      return;
    }
    if (multiple && values.length + selected.length > maxFiles) {
      setError(`Maksimal ${maxFiles} gambar.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of multiple ? selected : selected.slice(0, 1)) {
        const body = new FormData();
        body.append("file", file);
        body.append("purpose", purpose);
        body.append("visibility", visibility);
        if (orderId) body.append("orderId", orderId);
        if (revisionId) body.append("revisionId", revisionId);
        const response = await fetch("/api/media/upload", { method: "POST", body });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || "Upload gagal");
        }
        uploaded.push(data.media.url);
        onUploaded?.({ id: data.media.id, url: data.media.url, mimeType: data.media.mimeType });
      }
      const nextValue = multiple ? [...values, ...uploaded] : uploaded[0] || "";
      if (persist) {
        const response = await fetch(persist.endpoint, {
          method: persist.method ?? "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [persist.key]: nextValue }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.success) {
          throw new Error(data?.error?.message || "Media berhasil diupload tetapi gagal disimpan.");
        }
      }
      onChange(nextValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = async (index: number) => {
    setError(null);
    const nextValue = multiple ? values.filter((_, itemIndex) => itemIndex !== index) : "";
    if (!persist) {
      onChange(nextValue);
      return;
    }
    setUploading(true);
    try {
      const response = await fetch(persist.endpoint, {
        method: persist.method ?? "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [persist.key]: nextValue }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || "Media dihapus dari preview tetapi gagal disimpan.");
      }
      onChange(nextValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus media");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-dark dark:text-slate-100">{label}</label>
        {helpText && <span className="text-xs text-dark-400 dark:text-slate-500">{helpText}</span>}
      </div>

      {values.length > 0 && (
        <div className={cn("grid gap-3", multiple ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1")}>
          {values.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative aspect-video overflow-hidden rounded-xl border border-dark-200 bg-dark-50 dark:border-slate-700 dark:bg-slate-900">
              {url.match(/\.(mp4|webm|mov)(?:[?#].*)?$/i) || url.includes("/video/upload/") ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <SiteImage src={url} alt={`${label} ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 640px" className="h-full w-full object-cover" />}
              <button type="button" onClick={() => { void removeAt(index); }} aria-label={`Hapus ${label} ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(!values.length || multiple) && (
        <button
          type="button"
          disabled={uploading || (multiple && values.length >= maxFiles)}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void uploadFiles(event.dataTransfer.files);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-200 bg-white px-4 py-8 text-center transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-primary/10"
        >
          {uploading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : <ImagePlus className="h-7 w-7 text-dark-400 dark:text-slate-500" />}
          <span className="text-sm font-semibold text-dark dark:text-slate-100">{uploading ? "Mengunggah…" : allowVideo ? "Upload gambar / video" : "Upload gambar"}</span>
          <span className="text-xs text-dark-400 dark:text-slate-500">Klik atau drag & drop • {allowVideo ? "JPG, PNG, WEBP, GIF, MP4, WEBM, MOV" : "JPG, PNG, WEBP, GIF"} • maksimal 25 MB</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Upload className="h-3.5 w-3.5" /> Pilih file{allowVideo ? " media" : " gambar"}</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept={effectiveAccept} multiple={multiple} className="hidden" onChange={(event) => { if (event.target.files) void uploadFiles(event.target.files); }} />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

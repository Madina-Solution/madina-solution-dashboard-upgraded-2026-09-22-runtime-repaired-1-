"use client";

import * as React from "react";
import { AlertCircle, Minus, Plus, ShoppingCart, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-provider";
import { useToast } from "@/components/ui/toast";
import type { ProductOption } from "@/db/schema";
import { calculateTotalPrice, validateConfiguration } from "@/lib/validations/product";

type Props = {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  thumbnail: string | null;
  basePrice: number;
  estimatedDays: number;
  options: ProductOption[];
  fulfillmentType: string;
};

export function ServiceConfiguration({ serviceId, serviceName, serviceSlug, thumbnail, basePrice, estimatedDays, options, fulfillmentType }: Props) {
  const { addItem, openDrawer } = useCart();
  const { toast } = useToast();
  const minOrder = 1;
  const [quantity, setQuantity] = React.useState(1);
  const [selectedOptions, setSelectedOptions] = React.useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    options.forEach((option) => { if (option.defaultValue) defaults[option.key] = option.defaultValue; });
    return defaults;
  });
  const [notes, setNotes] = React.useState("");
  const [uploadingKey, setUploadingKey] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string>>({});

  const sortedOptions = React.useMemo(() => [...options].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)), [options]);
  const { unitPrice, subtotal, breakdown } = React.useMemo(() => calculateTotalPrice(basePrice, quantity, selectedOptions, options), [basePrice, quantity, selectedOptions, options]);

  const setOption = (key: string, value: string) => { setSelectedOptions((prev) => ({ ...prev, [key]: value })); setErrors([]); };

  const uploadFile = async (option: ProductOption, file: File) => {
    if (file.size > 25 * 1024 * 1024 || (!file.type.startsWith("image/") && file.type !== "application/pdf")) {
      setUploadErrors((prev) => ({ ...prev, [option.key]: "File harus gambar atau PDF maksimal 25 MB." }));
      return;
    }
    setUploadErrors((prev) => ({ ...prev, [option.key]: "" }));
    setUploadingKey(option.key);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "customer_upload");
      form.append("visibility", "private");
      form.append("orderId", "");
      const response = await fetch("/api/media/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Upload gagal");
      setOption(option.key, data.media.url);
    } catch (error) {
      setUploadErrors((prev) => ({ ...prev, [option.key]: error instanceof Error ? error.message : "Upload gagal" }));
    } finally { setUploadingKey(null); }
  };

  const summary = sortedOptions.filter((o) => selectedOptions[o.key]).map((o) => {
    const value = selectedOptions[o.key];
    const match = o.values?.find((v) => v.value === value);
    return `${o.name}: ${match?.label || value}`;
  }).join(" · ");

  const addToCart = () => {
    const validation = validateConfiguration({ productId: serviceId, quantity, selectedOptions, notes: notes || undefined }, options, minOrder);
    if (!validation.valid) { setErrors(validation.errors); return; }
    addItem({
      itemType: "service",
      serviceId,
      productId: "",
      productName: serviceName,
      productSlug: serviceSlug,
      productThumbnail: thumbnail,
      selectedOptions,
      optionsSummary: summary,
      unit: fulfillmentType === "digital" ? "paket" : "project",
      quantity,
      estimatedUnitPrice: unitPrice,
      estimatedSubtotal: subtotal,
      notes,
    });
    toast({ type: "success", title: "Layanan ditambahkan", description: `${serviceName} siap dilanjutkan ke checkout.` });
    openDrawer();
  };

  return (
    <Card className="border-primary/15 shadow-premium">
      <CardContent className="p-6 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pesan layanan</p>
            <h2 className="mt-1 text-xl font-bold text-dark">Sesuaikan kebutuhan Anda</h2>
            <p className="mt-1 text-sm text-dark-500">Atur spesifikasi, upload bahan, lalu lanjutkan ke checkout.</p>
          </div>
          <span className="rounded-full bg-dark-50 px-3 py-1.5 text-xs font-semibold text-dark-600">Estimasi {estimatedDays} hari</span>
        </div>

        {sortedOptions.length > 0 && (
          <div className="mt-6 space-y-5">
            {sortedOptions.map((option) => (
              <div key={option.id}>
                <label className="mb-2 block text-sm font-semibold text-dark">{option.name}{option.required && <span className="ml-1 text-red-500">*</span>}</label>
                {option.helpText && <p className="mb-2 text-xs text-dark-500">{option.helpText}</p>}
                {(option.type === "select" || option.type === "radio") && option.values && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {option.values.map((value) => (
                      <button key={value.value} type="button" onClick={() => setOption(option.key, value.value)} className={cn("flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition", selectedOptions[option.key] === value.value ? "border-primary bg-primary/5 text-primary" : "border-dark-200 text-dark-700 hover:border-dark-300 hover:bg-dark-50")}>
                        <span className="font-medium">{value.label}</span>
                        {value.priceModifier ? <span className="text-xs font-semibold">{value.priceModifier > 0 ? "+" : "-"}{formatCurrency(Math.abs(value.priceModifier))}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
                {(option.type === "text" || option.type === "number" || option.type === "size") && <Input type={option.type === "number" ? "number" : "text"} placeholder={option.placeholder || `Masukkan ${option.name.toLowerCase()}`} value={selectedOptions[option.key] || ""} onChange={(e) => setOption(option.key, e.target.value)} />}
                {option.type === "textarea" && <textarea value={selectedOptions[option.key] || ""} onChange={(e) => setOption(option.key, e.target.value)} placeholder={option.placeholder || `Masukkan ${option.name.toLowerCase()}`} rows={4} className="w-full rounded-xl border border-dark-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />}
                {option.type === "checkbox" && (
                  <label className="flex items-center gap-3 rounded-xl border border-dark-200 bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={String(selectedOptions[option.key] ?? "false") === "true"}
                      onChange={(e) => setOption(option.key, e.target.checked ? "true" : "false")}
                      className="h-4 w-4 rounded border-dark-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-dark-700">{option.placeholder || option.helpText || "Aktifkan pilihan ini"}</span>
                  </label>
                )}
                {option.type === "file" && (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark-200 bg-dark-50/50 px-4 py-6 text-center transition hover:border-primary hover:bg-primary/5">
                    {uploadingKey === option.key ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-dark-400" />}
                    <span className="mt-2 text-sm font-semibold text-dark">{selectedOptions[option.key] ? "Ganti file" : "Upload file"}</span>
                    <span className="mt-1 text-xs text-dark-400">Gambar/PDF · maksimal 25 MB</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploadingKey === option.key} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFile(option, file); }} />
                  </label>
                )}
                {selectedOptions[option.key] && option.type === "file" && <div className="mt-2 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"><span className="truncate">File siap dilampirkan</span><button type="button" onClick={() => setOption(option.key, "")} aria-label="Hapus file"><X className="h-4 w-4" /></button></div>}
                {uploadErrors[option.key] && <p className="mt-1 text-xs text-red-600">{uploadErrors[option.key]}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><label className="mb-2 block text-sm font-semibold text-dark">Jumlah</label><div className="flex items-center rounded-xl border border-dark-200 w-fit"><Button type="button" variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(minOrder, q - 1))} disabled={quantity <= minOrder}><Minus className="h-4 w-4" /></Button><span className="min-w-14 text-center text-sm font-semibold text-dark">{quantity}</span><Button type="button" variant="ghost" size="icon" onClick={() => setQuantity((q) => q + 1)}><Plus className="h-4 w-4" /></Button></div></div>
          <div><label className="mb-2 block text-sm font-semibold text-dark">Catatan</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief, warna, referensi, atau kebutuhan khusus…" className="w-full rounded-xl border border-dark-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div>
        </div>

        {errors.length > 0 && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex gap-3"><AlertCircle className="h-5 w-5 text-red-500" /><div><p className="font-semibold text-red-700">Mohon lengkapi konfigurasi</p><ul className="mt-1 list-inside list-disc text-sm text-red-600">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div></div></div>}

        <div className="mt-6 rounded-2xl bg-dark-50 p-4">
          <div className="flex items-center justify-between text-sm text-dark-600"><span>Harga satuan</span><span className="font-semibold text-dark">{formatCurrency(unitPrice)}</span></div>
          {breakdown.length > 1 && <div className="mt-2 space-y-1 border-t border-dark-200 pt-2">{breakdown.slice(1).map((line) => <div key={line.label} className="flex items-center justify-between text-xs text-dark-500"><span>{line.label}</span><span>{line.amount >= 0 ? "+" : "-"}{formatCurrency(Math.abs(line.amount))}</span></div>)}</div>}
          <div className="mt-3 flex items-center justify-between border-t border-dark-200 pt-3"><span className="font-semibold text-dark">Estimasi subtotal</span><span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span></div>
        </div>

        <Button type="button" size="lg" className="mt-5 w-full" onClick={addToCart}><ShoppingCart className="mr-2 h-5 w-5" /> Tambah Layanan ke Keranjang</Button>
      </CardContent>
    </Card>
  );
}

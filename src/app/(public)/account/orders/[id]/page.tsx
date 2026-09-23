"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Loader2,
  MapPin,
  MessageCircle, Download, ExternalLink, FileText, Image as ImageIcon, ImageOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";
import { BRAND } from "@/lib/constants";

const STATUS_STEPS = [
  { key: "pending", label: "Pesanan Dibuat", icon: Clock },
  { key: "confirmed", label: "Dikonfirmasi", icon: CheckCircle2 },
  { key: "design_review", label: "Review Desain", icon: Package },
  { key: "design_approved", label: "Desain Disetujui", icon: CheckCircle2 },
  { key: "production", label: "Produksi", icon: Package },
  { key: "quality_control", label: "Quality Control", icon: Package },
  { key: "ready", label: "Siap", icon: CheckCircle2 },
  { key: "shipping", label: "Dikirim", icon: Truck },
  { key: "completed", label: "Selesai", icon: CheckCircle2 },
];

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  deliveryMethod: string | null;
  shippingAddress: { recipientName?: string; phone?: string; address?: string; city?: string; province?: string } | null;
  notes: string | null;
  createdAt: string;
  items: { id: string; name: string; quantity: number; unitPrice: number; subtotal: number; configuration: Record<string, unknown>; designFiles: string[]; fulfillmentType: string; notes: string | null; productThumbnail: string | null; productSlug: string | null }[];
  revisions: { id: string; orderItemId: string | null; revisionNumber: number; status: string; fileUrl: string | null; previewUrl: string | null; notes: string | null; createdAt: string; submittedAt: string | null; approvedAt: string | null }[];
  downloadableMedia: { id: string; filename: string; url: string; downloadUrl: string; mimeType: string; size: number; purpose: string }[];
  timeline: { id: string; status: string; notes: string | null; createdAt: string }[];
};

export default function CustomerOrderDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !params.id) return;
    fetch(`/api/account/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrder(data.order);
        else setError(data.error?.message || "Pesanan tidak ditemukan");
      })
      .catch(() => setError("Gagal memuat pesanan"))
      .finally(() => setIsLoading(false));
  }, [user, params.id]);

  if (!user) return null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (error || !order) {
    return (
      <div className="py-12 text-center">
        <p className="text-dark-500">{error || "Pesanan tidak ditemukan"}</p>
        <Button variant="outline" className="mt-4" asChild><Link href="/account/orders"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link></Button>
      </div>
    );
  }

  // Determine progress step index
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="rounded-lg p-2 text-dark-400 hover:bg-dark-100 hover:text-dark">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-dark">{order.orderNumber}</h2>
          <p className="text-sm text-dark-500">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>
          {order.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}
        </Badge>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-dark">Status Pesanan</h3>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const Icon = step.icon;
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center gap-1.5 text-center" style={{ minWidth: 72 }}>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isCurrent ? "bg-primary text-white" : isCompleted ? "bg-green-100 text-green-600" : "bg-dark-100 text-dark-400"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[10px] leading-tight ${isCurrent ? "font-semibold text-primary" : isCompleted ? "text-dark-600" : "text-dark-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-0.5 min-w-4 flex-1 rounded ${i < currentStepIndex ? "bg-green-400" : "bg-dark-200"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-red-700">Pesanan ini telah dibatalkan.</p>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-dark">Produk</h3>
          <div className="mt-4 space-y-4">
            {order.items.map((item) => {
              const config = item.configuration || {};
              return (
                <div key={item.id} className="flex gap-4 rounded-xl border border-dark-100 p-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-dark-50">{item.productThumbnail ? <SiteImage src={item.productThumbnail} alt={item.name} fill sizes="48px" className="object-cover" /> : <div className="grid h-full place-items-center text-dark-300"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>}</div>
                  <div className="flex-1">
                    <p className="font-medium text-dark">{item.name}</p>
                    {Object.keys(config).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(config).map(([k, v]) => (
                          <span key={k} className="rounded bg-dark-50 px-1.5 py-0.5 text-xs text-dark-600">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-dark-500">{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                      <span className="font-semibold text-dark">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-dark-100 pt-4 text-lg font-bold">
            <span className="text-dark">Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      {(order.paymentStatus === "paid" && order.status === "completed") && (order.downloadableMedia.length > 0 || order.revisions.some((r) => r.fileUrl || r.previewUrl)) && (
        <Card className="border-primary/15 bg-primary/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 font-semibold text-dark"><Download className="h-5 w-5 text-primary" /> Hasil Pesanan Digital</h3><p className="mt-1 text-sm text-dark-500">File tersedia karena pembayaran telah terverifikasi dan pesanan sudah selesai.</p></div><Badge variant="success">Terverifikasi</Badge></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {order.revisions.flatMap((r) => [
                r.previewUrl ? { key: `${r.id}-preview`, label: `Preview revisi ${r.revisionNumber}`, url: r.previewUrl, preview: true } : null,
                r.fileUrl ? { key: `${r.id}-file`, label: `File final revisi ${r.revisionNumber}`, url: `/api/account/orders/${order.id}/revisions/${r.id}/file`, preview: false } : null,
              ]).filter(Boolean).map((file) => file && <a key={file.key} href={file.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-dark-100 bg-white p-4 transition hover:border-primary/30 hover:shadow-sm"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{file.preview ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</div><span className="truncate text-sm font-semibold text-dark group-hover:text-primary">{file.label}</span></div><ExternalLink className="h-4 w-4 shrink-0 text-dark-400" /></a>)}
              {order.downloadableMedia.map((file) => <a key={file.id} href={file.downloadUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border border-dark-100 bg-white p-4 transition hover:border-primary/30 hover:shadow-sm"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-50 text-dark-600"><FileText className="h-5 w-5" /></div><span className="truncate text-sm font-semibold text-dark group-hover:text-primary">{file.filename}</span></div><Download className="h-4 w-4 shrink-0 text-primary" /></a>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery */}
      {order.shippingAddress && (
        <Card>
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 font-semibold text-dark"><MapPin className="h-4 w-4" /> Pengiriman</h3>
            <div className="mt-3 text-sm text-dark-600">
              <p className="font-medium text-dark">{order.shippingAddress.recipientName}</p>
              <p className="mt-1">{order.shippingAddress.address}</p>
              <p>{[order.shippingAddress.city, order.shippingAddress.province].filter(Boolean).join(", ")}</p>
              {order.shippingAddress.phone && <p className="mt-1">{order.shippingAddress.phone}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design Review — show when order is in design phase */}
      {(order.status === "design_review" || order.status === "design_approved") && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-6">
            <h3 className="flex items-center gap-2 font-semibold text-dark">
              <Package className="h-4 w-4 text-purple-600" /> Review Desain
            </h3>
            <p className="mt-2 text-sm text-dark-600">
              {order.status === "design_review"
                ? "Desain sedang dalam proses review. Anda akan menerima notifikasi saat desain siap untuk ditinjau."
                : "Desain telah disetujui dan pesanan sedang diproses ke tahap produksi."}
            </p>
            {order.status === "design_review" && (
              <p className="mt-3 text-xs text-dark-500">
                Gunakan halaman notifikasi untuk melihat update terbaru dari desainer.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {order.timeline.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-dark">Riwayat</h3>
            <div className="mt-4 space-y-4">
              {order.timeline.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${i === 0 ? "bg-primary" : "bg-dark-300"}`} />
                    {i < order.timeline.length - 1 && <div className="w-0.5 flex-1 bg-dark-200" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-dark">{entry.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
                    {entry.notes && <p className="mt-0.5 text-xs text-dark-500">{entry.notes}</p>}
                    <p className="mt-0.5 text-xs text-dark-400">{formatDate(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp CTA */}
      <Button variant="secondary" className="w-full" size="lg" asChild>
        <a
          href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20menanyakan%20pesanan%20${encodeURIComponent(order.orderNumber)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Tanya via WhatsApp
        </a>
      </Button>
    </div>
  );
}

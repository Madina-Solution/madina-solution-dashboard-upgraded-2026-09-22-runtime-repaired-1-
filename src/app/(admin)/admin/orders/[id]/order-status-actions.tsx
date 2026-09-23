"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VALID_TRANSITIONS } from "@/lib/order-utils";
import { Loader2 } from "lucide-react";

const STATUS_ACTIONS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Konfirmasi Pesanan", color: "bg-blue-600 hover:bg-blue-700" },
  design_review: { label: "Kirim ke Review Desain", color: "bg-purple-600 hover:bg-purple-700" },
  design_approved: { label: "Setujui Desain", color: "bg-indigo-600 hover:bg-indigo-700" },
  production: { label: "Mulai Produksi", color: "bg-orange-600 hover:bg-orange-700" },
  quality_control: { label: "Quality Control", color: "bg-cyan-600 hover:bg-cyan-700" },
  ready: { label: "Tandai Siap", color: "bg-teal-600 hover:bg-teal-700" },
  shipping: { label: "Kirim Pesanan", color: "bg-blue-600 hover:bg-blue-700" },
  completed: { label: "Selesai", color: "bg-green-600 hover:bg-green-700" },
  cancelled: { label: "Batalkan", color: "bg-red-600 hover:bg-red-700" },
};

type Props = {
  orderId: string;
  currentStatus: string;
};

export function OrderStatusActions({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (allowed.length === 0) {
    return (
      <div className="rounded-2xl border border-dark-100 bg-white p-6">
        <h2 className="font-semibold text-dark">Aksi</h2>
        <p className="mt-2 text-sm text-dark-500">
          Tidak ada aksi yang tersedia untuk status ini.
        </p>
      </div>
    );
  }

  const handleTransition = async (newStatus: string) => {
    setIsLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: note || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          type: "error",
          title: "Gagal mengubah status",
          description: data.error?.message || "Terjadi kesalahan",
        });
        return;
      }

      toast({
        type: "success",
        title: "Status diperbarui",
        description: `Pesanan berhasil diubah ke ${STATUS_ACTIONS[newStatus]?.label || newStatus}`,
      });
      setNote("");
      router.refresh();
    } catch {
      toast({ type: "error", title: "Gagal", description: "Koneksi gagal" });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-dark-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <h2 className="font-semibold text-dark dark:text-white">Aksi</h2>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-dark dark:text-slate-200">Catatan (Opsional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan..."
          rows={2}
          className="w-full rounded-xl border border-dark-200 px-3 py-2 text-sm placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-4 space-y-2">
        {allowed.filter(s => s !== "cancelled").map((status) => {
          const action = STATUS_ACTIONS[status];
          if (!action) return null;
          return (
            <button
              key={status}
              onClick={() => handleTransition(status)}
              disabled={!!isLoading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${action.color}`}
            >
              {isLoading === status && <Loader2 className="h-4 w-4 animate-spin" />}
              {action.label}
            </button>
          );
        })}

        {allowed.includes("cancelled") && (
          <button
            onClick={() => setConfirmCancel(true)}
            disabled={!!isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {isLoading === "cancelled" && <Loader2 className="h-4 w-4 animate-spin" />}
            Batalkan Pesanan
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        variant="danger"
        title="Batalkan pesanan ini?"
        description="Pesanan yang dibatalkan tidak dapat dikembalikan ke status semula. Pastikan pelanggan sudah diberitahu sebelum melanjutkan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        isLoading={isLoading === "cancelled"}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => { setConfirmCancel(false); void handleTransition("cancelled"); }}
      />
    </div>
  );
}

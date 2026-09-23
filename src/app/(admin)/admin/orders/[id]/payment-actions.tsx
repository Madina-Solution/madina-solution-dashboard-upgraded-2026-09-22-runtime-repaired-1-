"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PaymentConfirmationActions({ paymentId, status, hasProof }: { paymentId: string; status: string; hasProof: boolean }) {
  const { toast } = useToast();
  const [reason, setReason] = React.useState("Bukti transfer diverifikasi dan pembayaran dinyatakan lunas.");
  const [busy, setBusy] = React.useState(false);

  if (status === "paid") {
    return <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" /> Pembayaran sudah dikonfirmasi.</div>;
  }

  const confirm = async () => {
    if (reason.trim().length < 5) {
      toast({ type: "error", title: "Tambahkan alasan konfirmasi" });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error?.message || "Gagal mengonfirmasi pembayaran");
      toast({ type: "success", title: "Pembayaran dikonfirmasi", description: "Status order dan buku kas pemasukan sudah disinkronkan." });
      window.location.reload();
    } catch (error) {
      toast({ type: "error", title: "Konfirmasi gagal", description: error instanceof Error ? error.message : "Silakan coba lagi." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="text-xs font-bold text-amber-900 dark:text-amber-200">{hasProof ? "Bukti transfer menunggu verifikasi" : "Pembayaran manual belum dikonfirmasi"}</p><p className="mt-0.5 text-[11px] leading-5 text-amber-800/80 dark:text-amber-200/70">Konfirmasi hanya setelah mutasi rekening/bukti transfer benar-benar cocok dengan nominal order.</p></div></div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-3 w-full rounded-lg border border-amber-200 bg-white p-2 text-xs text-dark-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-amber-900/50 dark:bg-slate-950 dark:text-slate-100" aria-label="Alasan konfirmasi pembayaran" />
      <Button type="button" disabled={busy} onClick={() => void confirm()} className="mt-2 w-full" size="sm">
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Konfirmasi Lunas
      </Button>
    </div>
  );
}

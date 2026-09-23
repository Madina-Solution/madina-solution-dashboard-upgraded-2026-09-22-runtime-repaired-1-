"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SegmentError({ error, reset, title = "Halaman mengalami gangguan" }: { error: Error & { digest?: string }; reset: () => void; title?: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-5 py-16">
      <section className="w-full rounded-3xl border border-dark-100 bg-white p-8 text-center shadow-premium sm:p-10" role="alert">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">Madina Solution</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-dark">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-dark-500">Terjadi kesalahan sementara. Anda dapat mencoba memuat ulang bagian ini atau kembali ke halaman utama.</p>
        {error?.digest && <p className="mt-3 text-xs text-dark-400">ID: {error.digest}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => reset()}><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Coba lagi</Button>
          <Button variant="outline" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Ke beranda</Link></Button>
        </div>
      </section>
    </main>
  );
}

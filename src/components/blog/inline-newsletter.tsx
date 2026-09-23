"use client";

import * as React from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function InlineNewsletter({ title = "Dapatkan insight berikutnya", text = "Tips desain, printing, branding, dan pertumbuhan bisnis langsung ke inbox Anda." }: { title?: string; text?: string }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
      if (!response.ok) throw new Error("subscribe failed");
      setState("success");
    } catch { setState("error"); }
  };
  return <section className="my-10 rounded-3xl border border-primary/15 bg-primary/[.035] p-5 sm:p-7" aria-label="Newsletter">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Newsletter</p><h2 className="mt-1.5 text-xl font-black text-dark">{title}</h2><p className="mt-2 text-sm leading-6 text-dark-600">{text}</p></div>
      {state === "success" ? <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><Check className="h-4 w-4" aria-hidden="true" />Email berhasil didaftarkan.</div> : <form onSubmit={submit} className="flex w-full max-w-lg flex-col gap-2 sm:flex-row"><label htmlFor="article-newsletter-email" className="sr-only">Alamat email</label><input id="article-newsletter-email" name="email" type="email" required autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); if (state !== "idle") setState("idle"); }} placeholder="nama@perusahaan.com" className="min-w-0 flex-1 rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" /><button type="submit" disabled={state === "loading"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 text-sm font-bold text-white hover:bg-dark-800 disabled:opacity-60">{state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}Berlangganan</button>{state === "error" && <p className="text-xs font-medium text-red-600 sm:col-span-2">Pendaftaran belum berhasil. Silakan coba lagi.</p>}</form>}
    </div>
  </section>;
}

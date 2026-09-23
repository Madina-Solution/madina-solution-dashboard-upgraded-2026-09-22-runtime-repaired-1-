"use client";

import * as React from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.message || "Berhasil berlangganan!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error?.message || "Gagal");
      }
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
      <label className="sr-only" htmlFor="newsletter-email">Alamat email untuk newsletter</label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Masukkan email Anda"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        className="border-dark-600 bg-dark-800 text-white placeholder:text-dark-400 focus:border-primary"
      />
      <Button type="submit" disabled={status === "loading"} aria-label="Berlangganan newsletter" title="Berlangganan newsletter">
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
          <span className="hidden sm:inline">Berlangganan</span>
          <ArrowRight className="h-4 w-4 sm:ml-2" aria-hidden="true" />
        </>}
      </Button>
    </form>
  );
}

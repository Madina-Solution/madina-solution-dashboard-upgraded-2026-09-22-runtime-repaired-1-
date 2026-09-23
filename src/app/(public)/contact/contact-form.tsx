"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const { toast } = useToast();
  const [isSending, setIsSending] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast({ type: "error", title: "Nama, email, dan pesan wajib diisi" });
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: "Pesan terkirim!", description: "Tim kami akan segera menghubungi Anda." });
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal mengirim pesan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan. Silakan coba lagi." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark">Nama Lengkap *</label>
          <Input placeholder="Nama Anda" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-dark">Email *</label>
          <Input type="email" placeholder="email@contoh.com" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-dark">Nomor WhatsApp</label>
          <Input placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-dark">Subjek</label>
          <Input placeholder="Perihal pesan Anda" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-dark">Pesan *</label>
        <textarea
          rows={5}
          className="flex w-full rounded-xl border border-dark-200 bg-white px-4 py-3 text-base text-dark-900 transition-colors placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Jelaskan kebutuhan Anda..."
          value={form.message}
          onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
        />
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSending}>
        {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</> : "Kirim Pesan"}
      </Button>
    </form>
  );
}

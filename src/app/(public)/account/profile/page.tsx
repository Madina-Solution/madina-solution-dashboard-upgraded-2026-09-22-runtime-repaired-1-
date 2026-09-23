"use client";
import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MediaUploader } from "@/components/ui/media-uploader";
import { Loader2, Mail, Phone, ShieldCheck, CalendarDays } from "lucide-react";
import { USER_ROLES } from "@/lib/constants";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", phone: "", avatar: "" });

  if (!user) return null;
  const displayRole = USER_ROLES[user.role as keyof typeof USER_ROLES] || user.role;
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ type: "error", title: "Nama wajib diisi" }); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: "Profil diperbarui" }); setIsEditing(false); await refresh(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } catch { toast({ type: "error", title: "Terjadi kesalahan" }); } finally { setIsSaving(false); }
  };

  const beginEdit = () => setForm({ name: user.name, phone: user.phone || "", avatar: user.avatar || "" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-2xl font-bold text-dark">Profil Saya</h2><p className="mt-1 text-dark-500">Kelola identitas, foto, dan informasi kontak akun Anda.</p></div>
        {!isEditing && <Button variant="outline" onClick={() => { beginEdit(); setIsEditing(true); }}>Edit Profil</Button>}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 border-b border-dark-100 pb-6 sm:flex-row sm:items-center">
            {user.avatar ? <SiteImage src={user.avatar} alt={user.name} width={80} height={80} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-primary/10" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white ring-4 ring-primary/10">{user.name.charAt(0).toUpperCase()}</div>}
            <div className="min-w-0"><h3 className="text-xl font-semibold text-dark">{user.name}</h3><p className="mt-1 text-dark-500">{user.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant="secondary">{displayRole}</Badge><Badge variant="success">Akun Aktif</Badge></div></div>
          </div>
          {isEditing ? (
            <div className="space-y-5 pt-6">
              <MediaUploader value={form.avatar} onChange={(value) => setForm((p) => ({ ...p, avatar: Array.isArray(value) ? value[0] || "" : value }))} purpose="avatar" label="Foto Profil" helpText="Opsional • JPG, PNG, WEBP — upload langsung tersimpan." persist={{ endpoint: "/api/account/profile", key: "avatar", method: "PATCH", mode: "replace" }} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-medium text-dark">Nama Lengkap</label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-dark">Nomor Telepon</label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="08xx-xxxx-xxxx" /></div>
              </div>
              <div className="flex gap-2"><Button onClick={handleSave} isLoading={isSaving}>Simpan Profil</Button><Button variant="outline" onClick={() => setIsEditing(false)}>Batal</Button></div>
            </div>
          ) : (
            <div className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="rounded-xl border border-dark-100 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400"><Mail className="h-4 w-4" />Email</div><p className="mt-2 text-sm font-medium text-dark">{user.email}</p></div>
              <div className="rounded-xl border border-dark-100 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400"><Phone className="h-4 w-4" />Telepon</div><p className="mt-2 text-sm font-medium text-dark">{user.phone || "Belum diisi"}</p></div>
              <div className="rounded-xl border border-dark-100 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400"><ShieldCheck className="h-4 w-4" />Peran</div><p className="mt-2 text-sm font-medium text-dark">{displayRole}</p></div>
              <div className="rounded-xl border border-dark-100 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dark-400"><CalendarDays className="h-4 w-4" />Bergabung</div><p className="mt-2 text-sm font-medium text-dark">{joined}</p></div>
            </div>
          )}
        </CardContent>
      </Card>
      {isSaving && <div className="flex items-center justify-center text-sm text-dark-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan profil...</div>}
    </div>
  );
}

"use client";

import * as React from "react";
import { Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = React.useState<string | null>(null);

  if (!user) return null;

  const handlePasswordChange = async () => {
    setError(null);
    if (!form.currentPassword || !form.newPassword) { setError("Semua field wajib diisi"); return; }
    if (form.newPassword.length < 6) { setError("Password baru minimal 6 karakter"); return; }
    if (form.newPassword !== form.confirmPassword) { setError("Password baru tidak sama"); return; }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ type: "success", title: "Password berhasil diubah" });
        setShowPasswordForm(false);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError(data.error?.message || "Gagal mengubah password");
      }
    } catch { setError("Terjadi kesalahan"); }
    finally { setIsSaving(false); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-dark">Pengaturan</h2>
      <p className="mt-1 text-dark-500">Kelola pengaturan akun Anda</p>

      {/* Password */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Lock className="h-5 w-5 shrink-0 text-dark-500" />
              <div className="min-w-0"><h3 className="font-semibold text-dark">Password</h3><p className="truncate text-sm text-dark-500">Ubah password akun Anda</p></div>
            </div>
            {!showPasswordForm && <Button variant="outline" className="shrink-0" onClick={() => setShowPasswordForm(true)}>Ubah Password</Button>}
          </div>

          {showPasswordForm && (
            <div className="mt-6 space-y-4 border-t border-dark-100 pt-6">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Password Lama</label>
                <Input type="password" value={form.currentPassword} onChange={(e) => setForm(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Masukkan password lama" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Password Baru</label>
                <Input type="password" value={form.newPassword} onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark">Konfirmasi Password Baru</label>
                <Input type="password" value={form.confirmPassword} onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Ulangi password baru" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePasswordChange} isLoading={isSaving}>Simpan Password</Button>
                <Button variant="outline" onClick={() => { setShowPasswordForm(false); setError(null); }}>Batal</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-dark">Akun</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-dark-500">Email</span><span className="text-dark">{user.email}</span></div>
            <div className="flex justify-between"><span className="text-dark-500">Role</span><span className="capitalize text-dark">{user.role}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="mt-6 border-red-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-red-600">Zona Berbahaya</h3>
          <p className="mt-2 text-sm text-dark-500">Keluar dari akun Anda di perangkat ini.</p>
          <Button variant="destructive" className="mt-4" onClick={async () => { await logout(); window.location.href = "/"; }}>Keluar dari Akun</Button>
        </CardContent>
      </Card>
    </div>
  );
}

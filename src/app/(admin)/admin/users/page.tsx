"use client";
import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import { Loader2, Users, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { canAssignRole, getPermissions, ROLE_CAPABILITY_GROUPS, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/auth/permissions";

type User = { id: string; name: string; email: string; phone: string | null; avatar?: string | null; role: string; isActive: boolean; createdAt: string };

const ROLE_COLORS: Record<string, string> = { super_admin: "bg-red-100 text-red-700", admin: "bg-purple-100 text-purple-700", manager: "bg-blue-100 text-blue-700", staff: "bg-green-100 text-green-700", designer: "bg-orange-100 text-orange-700", production: "bg-cyan-100 text-cyan-700", customer: "bg-dark-100 text-dark-600" };
const ASSIGNABLE_ROLES = ["customer", "staff", "designer", "production", "manager", "admin", "super_admin"];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: actor } = useAuth();
  const [items, setItems] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [pendingRoleChange, setPendingRoleChange] = React.useState<{ id: string; name: string; newRole: string } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<User | null>(null);
  const [isMutating, setIsMutating] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try { const r = await fetch("/api/admin/users"); const d = await r.json(); if (d.success) setItems(d.users); } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const commitRoleChange = async (id: string, newRole: string) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
      const data = await res.json();
      if (data.success) { toast({ type: "success", title: `Role diubah ke ${ROLE_LABELS[newRole] || newRole}` }); await fetchData(); }
      else toast({ type: "error", title: data.error?.message || "Gagal" });
    } finally {
      setIsMutating(false);
      setPendingRoleChange(null);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
      if ((await res.json()).success) { toast({ type: "success", title: current ? "User dinonaktifkan" : "User diaktifkan" }); await fetchData(); }
    } finally {
      setIsMutating(false);
      setDeactivateTarget(null);
    }
  };

  // Role changes and deactivation both affect account access, so both go
  // through an explicit confirmation step; reactivating is low-risk.
  const handleRoleChange = (user: User, newRole: string) => {
    if (newRole === user.role) return;
    setPendingRoleChange({ id: user.id, name: user.name, newRole });
  };
  const handleToggleActive = (user: User) => {
    if (user.isActive) setDeactivateTarget(user);
    else void toggleActive(user.id, user.isActive);
  };

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-dark dark:text-white">Users & Roles</h1><p className="mt-1 text-dark-500 dark:text-slate-400">{filtered.length} pengguna</p></div>
        <div className="relative sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" /><Input placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      </div>

      <div className="rounded-2xl border border-dark-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div><div><h2 className="font-semibold text-dark dark:text-white">Matriks Akses Role</h2><p className="text-sm text-dark-500 dark:text-slate-400">Kontrol akses mengikuti prinsip least-privilege. Hanya Super Admin yang dapat mengelola role kritis.</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => <div key={role} className="rounded-xl border border-dark-100 bg-dark-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex items-center justify-between gap-2"><span className="font-semibold text-dark dark:text-white">{ROLE_LABELS[role]}</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-dark-500 dark:bg-slate-800 dark:text-slate-300">{getPermissions(role).length} akses</span></div><p className="mt-1 text-xs leading-relaxed text-dark-500 dark:text-slate-400">{description}</p><div className="mt-2 flex flex-wrap gap-1">{(ROLE_CAPABILITY_GROUPS[role] || []).map((item) => <span key={item} className="rounded-full border border-dark-100 bg-white px-2 py-0.5 text-[10px] font-medium text-dark-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{item}</span>)}</div></div>)}
        </div>
      </div>

      <div className="rounded-2xl border border-dark-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : filtered.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left dark:border-slate-800">
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">User</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Role</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Status</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Bergabung</th>
            <th className="px-5 py-3 font-medium text-dark-500 dark:text-slate-400">Aksi</th>
          </tr></thead><tbody>{filtered.map((u) => (
            <tr key={u.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50 dark:border-slate-900 dark:hover:bg-slate-900/50">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {u.avatar ? <SiteImage src={u.avatar} alt={u.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{u.name.charAt(0).toUpperCase()}</div>}
                  <div><p className="font-medium text-dark dark:text-white">{u.name}</p><p className="text-xs text-dark-400 dark:text-slate-500">{u.email}</p></div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <select value={u.role} disabled={isMutating} onChange={(e) => handleRoleChange(u, e.target.value)} className="rounded-lg border border-dark-200 bg-white px-2 py-1 text-xs font-medium text-dark focus:border-primary focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  {ASSIGNABLE_ROLES.filter((r) => r === u.role || (actor ? canAssignRole(actor.role, r) : false)).map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                </select>
              </td>
              <td className="px-5 py-3.5"><button type="button" aria-label={`${u.isActive ? "Nonaktifkan" : "Aktifkan"} pengguna ${u.name}`} onClick={() => handleToggleActive(u)}><Badge variant={u.isActive ? "success" : "error"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge></button></td>
              <td className="px-5 py-3.5 text-xs text-dark-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
              <td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[u.role] || "bg-dark-100 text-dark-600"}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
            </tr>
          ))}</tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Users className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark dark:text-white">{search ? "Tidak ditemukan" : "Belum ada user"}</p></div>}
      </div>

      <ConfirmDialog
        open={!!pendingRoleChange}
        variant="warning"
        title={`Ubah role ${pendingRoleChange?.name ?? "user ini"}?`}
        description={`Role akan diubah menjadi "${ROLE_LABELS[pendingRoleChange?.newRole ?? ""] || pendingRoleChange?.newRole}". Perubahan ini langsung memengaruhi hak akses pengguna.`}
        confirmLabel="Ya, Ubah Role"
        cancelLabel="Batal"
        isLoading={isMutating}
        onCancel={() => setPendingRoleChange(null)}
        onConfirm={() => { if (pendingRoleChange) void commitRoleChange(pendingRoleChange.id, pendingRoleChange.newRole); }}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        variant="danger"
        title={`Nonaktifkan ${deactivateTarget?.name ?? "user ini"}?`}
        description="User yang dinonaktifkan tidak dapat login ke sistem sampai diaktifkan kembali."
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        isLoading={isMutating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => { if (deactivateTarget) void toggleActive(deactivateTarget.id, deactivateTarget.isActive); }}
      />
    </div>
  );
}

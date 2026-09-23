"use client";

import * as React from "react";
import { Loader2, Star, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Review = { id: string; rating: number; comment: string | null; isApproved: boolean | null; isVerified: boolean | null; createdAt: string; userName: string | null };

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Review[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.success) setItems(data.reviews);
    } catch {} finally { setIsLoading(false); }
  }, []);
  React.useEffect(() => {
    void (async () => { await fetchData(); })();
  }, [fetchData]);

  const handleModerate = async (id: string, approve: boolean) => {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isApproved: approve }) });
    if ((await res.json()).success) { toast({ type: "success", title: approve ? "Ulasan disetujui" : "Ulasan ditolak" }); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setIsDeleting(true);
    try { const r = await fetch(`/api/admin/reviews/${deleteTarget}`, { method: "DELETE" }); if ((await r.json()).success) { toast({ type: "success", title: "Ulasan dihapus" }); fetchData(); } } catch {} finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-dark">Ulasan</h1><p className="mt-1 text-dark-500">{items.length} ulasan</p></div>
      <div className="rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>
        : items.length > 0 ? (
          <div className="divide-y divide-dark-50">{items.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-4 p-5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-dark">{r.userName || "Anonim"}</span>
                  <Badge variant={r.isApproved ? "success" : "warning"}>{r.isApproved ? "Disetujui" : "Menunggu"}</Badge>
                </div>
                <div className="mt-1 flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-dark-200"}`} />)}</div>
                {r.comment && <p className="mt-2 text-sm text-dark-600">{r.comment}</p>}
                <p className="mt-1 text-xs text-dark-400">{formatDate(r.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!r.isApproved && <Button variant="ghost" size="icon" onClick={() => handleModerate(r.id, true)} title="Setujui"><Check className="h-4 w-4 text-green-600" /></Button>}
                {r.isApproved && <Button variant="ghost" size="icon" onClick={() => handleModerate(r.id, false)} title="Tolak"><X className="h-4 w-4 text-orange-600" /></Button>}
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}</div>
        ) : <div className="px-6 py-16 text-center text-dark-500">Belum ada ulasan.</div>}
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Hapus ulasan ini?" description="Ulasan akan dihapus permanen." confirmLabel="Hapus" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

"use client";

import * as React from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
};

export function ReviewForm({ productId }: Props) {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [existingReview, setExistingReview] = React.useState<{ rating: number; comment: string | null } | null>(null);
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function loadReview() {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const me = await meRes.json();
        if (cancelled) return;
        const loggedIn = Boolean(me?.user);
        setIsLoggedIn(loggedIn);
        if (!loggedIn) return;
        const reviewRes = await fetch(`/api/account/reviews?productId=${encodeURIComponent(productId)}`, { credentials: "include", cache: "no-store" });
        const reviewData = await reviewRes.json();
        const review = reviewData?.review ?? null;
        if (!cancelled) {
          setExistingReview(review);
          setRating(review?.rating ?? 0);
          setComment(review?.comment ?? "");
        }
      } catch {
        if (!cancelled) setIsLoggedIn(false);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void loadReview();
    return () => { cancelled = true; };
  }, [productId]);


  if (checkingSession) {
    return <div className="mt-6 rounded-xl border border-dark-100 bg-dark-50 p-5 text-center text-sm text-dark-500">Memeriksa status akun…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-dark-200 p-5 text-center">
        <p className="text-sm text-dark-600">
          <Link href="/login" className="font-semibold text-primary hover:underline">Login</Link> untuk memberi ulasan produk ini.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
        <p className="text-sm text-green-800">Terima kasih! Ulasan Anda sedang menunggu persetujuan admin sebelum tampil publik.</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating < 1) {
      toast({ type: "error", title: "Pilih rating bintang terlebih dahulu" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() || null }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast({ type: "success", title: data.message || "Ulasan terkirim" });
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal mengirim ulasan" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan, coba lagi" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-dark-100 bg-dark-50 p-5">
      <h3 className="font-semibold text-dark">{existingReview ? "Ubah Ulasan Anda" : "Tulis Ulasan"}</h3>
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${value} bintang`}
              className="p-0.5"
            >
              <Star className={cn("h-7 w-7 transition-colors", value <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-dark-200 text-dark-200")} />
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Bagaimana pengalaman Anda dengan produk ini? (opsional)"
        rows={3}
        maxLength={1000}
        className="mt-3 w-full resize-none rounded-xl border border-dark-200 bg-white px-4 py-2.5 text-sm text-dark-900 placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <Button className="mt-3" onClick={() => void handleSubmit()} disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {existingReview ? "Perbarui Ulasan" : "Kirim Ulasan"}
      </Button>
    </div>
  );
}

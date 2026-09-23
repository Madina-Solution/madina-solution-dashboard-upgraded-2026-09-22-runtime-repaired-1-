"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { signInWithSocialProvider } from "@/lib/auth/firebase-client";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.69-.06-1.36-.18-2H12v3.79h5.38a4.6 4.6 0 0 1-1.99 3.02v2.5h3.22c1.88-1.73 2.99-4.28 2.99-7.31Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.61-2.46l-3.22-2.5c-.89.6-2.02.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.06v2.58A9.98 9.98 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6 6 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.55H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.45l3.33-2.58Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.98 14.69 2 12 2a9.98 9.98 0 0 0-8.94 5.55l3.33 2.58C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

function FacebookMark() {
  return (
    <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.08c0-.87.24-1.46 1.5-1.46h1.61V3.93c-.28-.04-1.24-.12-2.35-.12-2.33 0-3.92 1.42-3.92 4.02V10H7.7v3h2.63v8h3.17Z" />
      </svg>
    </span>
  );
}

function socialErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code.includes("Firebase Authentication belum dikonfigurasi")) {
    return "Login Google belum dikonfigurasi lengkap. Periksa environment Firebase di Vercel, lalu redeploy aplikasi.";
  }
  if (code.includes("auth/unauthorized-domain")) {
    return "Domain website belum diizinkan oleh Firebase Authentication. Tambahkan madinasolution.vercel.app di Firebase Console → Authentication → Settings → Authorized domains.";
  }
  if (code.includes("auth/internal-error")) {
    return "Firebase mengembalikan internal-error. Periksa Firebase environment, Authorized Domains, provider Google, dan konfigurasi OAuth Web di Google Cloud.";
  }
  if (code.includes("auth/popup-closed-by-user")) return "Jendela login ditutup. Silakan coba lagi.";
  if (code.includes("auth/popup-blocked")) return "Browser memblokir jendela login. Izinkan pop-up untuk melanjutkan.";
  if (code.includes("auth/account-exists-with-different-credential")) {
    return "Email ini sudah memiliki metode login lain. Gunakan metode login yang sebelumnya terdaftar.";
  }
  return code || "Login sosial gagal. Silakan coba lagi.";
}

export function SocialAuthButtons({ mode = "login" }: { mode?: "login" | "register" }) {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [loading, setLoading] = React.useState<"google" | "facebook" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (provider: "google" | "facebook") => {
    setLoading(provider);
    setError(null);
    try {
      await signInWithSocialProvider(provider);
      await refresh();
      toast({
        type: "success",
        title: mode === "register" ? "Akun berhasil dibuat" : "Berhasil masuk",
        description: "Selamat datang di Madina Solution.",
      });
      router.push("/account");
    } catch (e) {
      setError(socialErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  const busy = loading !== null;

  return (
    <div className="space-y-3" aria-live="polite">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run("google")}
        aria-busy={loading === "google"}
        className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-dark-200 bg-white px-4 text-sm font-semibold text-dark shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-dark-300 hover:bg-dark-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-100 bg-white shadow-sm transition-transform group-hover:scale-105">
          {loading === "google" ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
        </span>
        <span className="flex-1 text-left">
          {loading === "google" ? "Menghubungkan ke Google…" : "Lanjutkan dengan Google"}
        </span>
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => void run("facebook")}
        aria-busy={loading === "facebook"}
        className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-dark-200 bg-white px-4 text-sm font-semibold text-dark shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-dark-300 hover:bg-dark-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-100 bg-white shadow-sm transition-transform group-hover:scale-105">
          {loading === "facebook" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FacebookMark />}
        </span>
        <span className="flex-1 text-left">
          {loading === "facebook" ? "Menghubungkan ke Facebook…" : "Lanjutkan dengan Facebook"}
        </span>
      </button>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

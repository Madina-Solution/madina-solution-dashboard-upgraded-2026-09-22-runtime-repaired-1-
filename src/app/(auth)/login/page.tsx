import { Metadata } from "next";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { LoginForm } from "./login-form";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Masuk", description: "Masuk ke akun Madina Solution untuk mengakses pesanan, akun, dan layanan.", path: "/login", noIndex: true });

export default function LoginPage() {
  return (
    <div>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-dark">Selamat Datang Kembali</h1>
        <p className="mt-2 text-dark-500">
          Masuk untuk melanjutkan ke dashboard Anda
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-dark-600">Masuk dengan Google, Facebook, atau email dan password yang terdaftar pada akun Madina Solution.
      </div>

      {/* Form */}
      <LoginForm />

      {/* Register link */}
      <p className="mt-8 text-center text-sm text-dark-500">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

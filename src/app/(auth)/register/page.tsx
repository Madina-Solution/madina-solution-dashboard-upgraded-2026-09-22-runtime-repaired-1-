import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Daftar", description: "Buat akun Madina Solution untuk memesan produk dan mengelola pesanan.", path: "/register", noIndex: true });

export default function RegisterPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-dark">Buat Akun Baru</h1>
        <p className="mt-2 text-dark-500">
          Bergabung untuk mulai memesan layanan bisnis Anda
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-dark-600">Pendaftaran menggunakan akun Madina Solution agar pesanan, desain, dan riwayat transaksi tersimpan dalam satu profil.</div>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-dark-500">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Masuk sekarang
        </Link>
      </p>
    </div>
  );
}

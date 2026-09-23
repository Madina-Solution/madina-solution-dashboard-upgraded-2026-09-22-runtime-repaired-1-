import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Lupa Password", description: "Reset password akun Madina Solution Anda.", path: "/forgot-password", noIndex: true });

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-dark">Lupa Password?</h1>
        <p className="mt-2 text-dark-500">
          Masukkan email Anda dan kami akan mengirimkan link untuk reset password
        </p>
      </div>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>

      <p className="mt-8 text-center text-sm text-dark-500">
        Ingat password Anda?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}

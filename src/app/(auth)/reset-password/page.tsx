import { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Reset Password", description: "Atur ulang password akun Madina Solution Anda.", path: "/reset-password", noIndex: true });

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return (
    <div>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-dark">Reset Password</h1>
        <p className="mt-2 text-dark-500">Buat password baru untuk akun Madina Solution Anda.</p>
      </div>
      <div className="mt-8"><ResetPasswordForm token={params.token || ""} /></div>
      <p className="mt-8 text-center text-sm text-dark-500"><Link href="/login" className="font-semibold text-primary">Kembali ke halaman masuk</Link></p>
    </div>
  );
}

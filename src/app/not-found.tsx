import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold text-dark">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 max-w-md text-dark-500">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">
              <Search className="mr-2 h-4 w-4" />
              Cari Produk
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

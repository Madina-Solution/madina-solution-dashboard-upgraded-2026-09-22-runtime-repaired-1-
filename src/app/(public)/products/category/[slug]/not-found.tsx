import Link from "next/link";
import { Folder, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-100">
        <Folder className="h-10 w-10 text-dark-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-dark">
        Kategori Tidak Ditemukan
      </h1>
      <p className="mt-2 max-w-md text-center text-dark-500">
        Maaf, kategori yang Anda cari tidak tersedia atau sudah tidak aktif.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Produk
          </Link>
        </Button>
      </div>
    </div>
  );
}

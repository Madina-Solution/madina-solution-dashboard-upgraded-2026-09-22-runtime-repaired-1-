"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-dark">
            Terjadi Kesalahan
          </h1>
          <p className="mt-2 max-w-md text-center text-dark-500">
            Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah
            diberitahu. Silakan coba lagi.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-dark-400">Error ID: {error.digest}</p>
          )}
          <div className="mt-8 flex gap-3">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Beranda
              </Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

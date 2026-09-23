"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "design_review", label: "Review Desain" },
  { value: "design_approved", label: "Desain OK" },
  { value: "production", label: "Produksi" },
  { value: "quality_control", label: "QC" },
  { value: "ready", label: "Siap" },
  { value: "shipping", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "unpaid", label: "Belum Bayar" },
  { value: "paid", label: "Lunas" },
];

type Props = {
  currentStatus?: string;
  currentPayment?: string;
  currentSearch?: string;
};

export function AdminOrderFilters({ currentStatus, currentPayment, currentSearch }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(currentSearch || "");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", search || null);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
        <Input
          placeholder="Cari nomor pesanan, nama, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button type="button" onClick={() => { setSearch(""); updateParam("q", null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <select
        value={currentStatus || "all"}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-11 rounded-xl border border-dark-200 bg-white px-3 text-sm font-medium text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={currentPayment || "all"}
        onChange={(e) => updateParam("payment", e.target.value)}
        className="h-11 rounded-xl border border-dark-200 bg-white px-3 text-sm font-medium text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {PAYMENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

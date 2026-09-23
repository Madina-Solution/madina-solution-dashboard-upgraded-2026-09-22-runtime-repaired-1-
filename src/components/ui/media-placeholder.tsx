import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaPlaceholder({ className, label = "Pratinjau belum tersedia" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-dark-50 via-white to-primary/5 text-dark-400", className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-dark-100 bg-white text-dark-300 shadow-sm">
        <ImageOff className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-dark-400">{label}</span>
    </div>
  );
}

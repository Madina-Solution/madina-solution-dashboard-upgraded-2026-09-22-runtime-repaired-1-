import { SiteImage } from "@/components/ui/site-image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  siteLogo?: string | null;
  siteName: string;
  tagline?: string | null;
  className?: string;
  logoClassName?: string;
  showText?: boolean;
  compact?: boolean;
  priority?: boolean;
};

export function BrandMark({
  siteLogo,
  siteName,
  tagline,
  className,
  logoClassName,
  showText = true,
  compact = false,
  priority = false,
}: BrandMarkProps) {
  const logoSize = compact ? "h-9 w-9" : "h-10 w-10";

  return (
    <span className={cn("flex min-w-0 items-center gap-3", className)}>
      <span className={cn("relative block shrink-0 overflow-hidden", logoSize, logoClassName)}>
        {siteLogo ? (
          <SiteImage
            src={siteLogo}
            alt={siteName}
            fill
            priority={priority}
            sizes={compact ? "36px" : "40px"}
            className="object-contain"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
            {siteName.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      {showText && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-extrabold tracking-tight text-dark-900 dark:text-white">{siteName}</span>
          {tagline && <span className="mt-0.5 block truncate text-[11px] font-medium text-dark-400 dark:text-slate-500">{tagline}</span>}
        </span>
      )}
    </span>
  );
}

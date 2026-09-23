import Image from "next/image";

export type SiteImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
};

/**
 * Central image renderer for local, Cloudinary, and external CMS URLs.
 * Images are optimized (resized, served as WebP/AVIF, responsive srcset)
 * for the known production hosts registered in next.config.ts
 * (res.cloudinary.com, images.unsplash.com) and for local `/...` paths.
 * Any other external host falls back to `unoptimized` so an unexpected URL
 * degrades gracefully instead of failing to render.
 */
const OPTIMIZED_HOSTS = ["res.cloudinary.com", "images.unsplash.com"];

function isOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    return OPTIMIZED_HOSTS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

export function SiteImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  sizes,
  priority,
  quality,
}: SiteImageProps) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={fill ? undefined : width ?? 1200}
      height={fill ? undefined : height ?? 800}
      fill={fill}
      sizes={fill ? sizes ?? "100vw" : undefined}
      priority={priority}
      quality={quality}
      unoptimized={!isOptimizable(src)}
    />
  );
}

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";

type Props = { thumbnail: string | null; gallery: string[]; productName: string };
function isVideo(src: string) { return /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(src) || src.includes("/video/upload/"); }
function normalizeMedia(thumbnail: string | null, gallery: string[]) { return Array.from(new Set([thumbnail, ...(gallery || [])].filter((value): value is string => Boolean(value && (/^https?:\/\//i.test(value) || value.startsWith("/")))))); }

export function ProductGallery({ thumbnail, gallery, productName }: Props) {
  const media = normalizeMedia(thumbnail, gallery);
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(media.length > 1);
  const [lightbox, setLightbox] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const touchStart = React.useRef<number | null>(null);
  const safeIndex = Math.min(index, Math.max(media.length - 1, 0));
  const active = media[safeIndex];
  const mediaKey = media.join("\u0000");
  const mediaCount = media.length;

  React.useEffect(() => {
    if (!playing || hovered || mediaCount <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % Math.max(mediaCount, 1));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [mediaKey, mediaCount, playing, hovered]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (lightbox && event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % Math.max(mediaCount, 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + Math.max(mediaCount, 1)) % Math.max(mediaCount, 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, mediaKey, mediaCount]);

  if (!media.length) return <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-dark-100 bg-dark-50"><MediaPlaceholder label="Belum ada media produk" /></div>;

  return (
    <>
      <div className="space-y-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-dark-100 bg-dark-50 shadow-sm" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const start = touchStart.current; const end = event.changedTouches[0]?.clientX ?? start ?? 0; touchStart.current = null; if (start !== null && Math.abs(end - start) > 48) end < start ? setIndex((current) => (current + 1) % Math.max(media.length, 1)) : setIndex((current) => (current - 1 + Math.max(media.length, 1)) % Math.max(media.length, 1)); }}>
          {isVideo(active) ? <video src={active} controls muted playsInline preload="metadata" className="h-full w-full object-contain bg-black" aria-label={`${productName} video ${safeIndex + 1}`} /> : <SiteImage src={active} alt={`${productName} ${safeIndex + 1}`} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" priority={safeIndex === 0} />}
          {media.length > 1 && <><Button type="button" variant="secondary" size="icon" aria-label="Media sebelumnya" onClick={() => setIndex((current) => (current - 1 + Math.max(media.length, 1)) % Math.max(media.length, 1))} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft /></Button><Button type="button" variant="secondary" size="icon" aria-label="Media berikutnya" onClick={() => setIndex((current) => (current + 1) % Math.max(media.length, 1))} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><ChevronRight /></Button><div className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-1rem)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full border border-white/20 bg-dark-950/80 px-3 py-2 backdrop-blur">{media.map((_, i) => <button type="button" key={i} aria-label={`Tampilkan media ${i + 1}`} aria-pressed={i === safeIndex} onClick={() => setIndex(i)} className={cn("h-1.5 shrink-0 rounded-full", i === safeIndex ? "w-6 bg-white" : "w-1.5 bg-white/55")} />)}</div></>}
          <div className="absolute right-3 top-3 flex gap-2">{media.length > 1 && <Button type="button" variant="secondary" size="icon" aria-label={playing ? "Jeda slideshow" : "Putar slideshow"} onClick={() => setPlaying((value) => !value)} className="rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white">{playing ? <Pause /> : <Play />}</Button>}<Button type="button" variant="secondary" size="icon" aria-label="Perbesar media" onClick={() => setLightbox(true)} className="rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><Expand /></Button></div>
        </div>
        {media.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{media.map((src, i) => <button type="button" key={`${src}-${i}`} onClick={() => setIndex(i)} aria-label={`Pilih media ${i + 1}`} aria-pressed={i === safeIndex} className={cn("relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border", i === safeIndex ? "border-primary ring-2 ring-primary/20" : "border-dark-100 hover:border-dark-300")}>{isVideo(src) ? <><video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/20"><span className="rounded-full bg-white/90 p-1"><Play className="h-3 w-3 fill-current" aria-hidden="true" /></span></span></> : <SiteImage src={src} alt={`${productName} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />}</button>)}</div>}
      </div>
      {lightbox && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${productName}`} onClick={() => setLightbox(false)}><div className="relative h-[88vh] w-[94vw]" onClick={(event) => event.stopPropagation()}>{isVideo(active) ? <video src={active} controls autoPlay muted playsInline className="h-full w-full object-contain" /> : <SiteImage src={active} alt={`${productName} preview`} fill sizes="94vw" className="object-contain" priority />}<Button type="button" variant="secondary" size="icon" aria-label="Tutup preview" onClick={() => setLightbox(false)} className="absolute right-2 top-2 rounded-full"><X /></Button></div></div>}
    </>
  );
}

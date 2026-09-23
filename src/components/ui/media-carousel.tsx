"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SiteImage } from "@/components/ui/site-image";

type Props = {
  items: string[];
  alt: string;
  className?: string;
  autoPlay?: boolean;
};

function isVideo(src: string) {
  return /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(src) || src.includes("/video/upload/");
}

export function MediaCarousel({ items, alt, className, autoPlay = true }: Props) {
  const media = Array.from(new Set(items.filter(Boolean)));
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(autoPlay);
  const [hovered, setHovered] = React.useState(false);
  const [lightbox, setLightbox] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  const next = React.useCallback(() => setIndex((i) => (i + 1) % Math.max(media.length, 1)), [media.length]);
  const prev = React.useCallback(() => setIndex((i) => (i - 1 + Math.max(media.length, 1)) % Math.max(media.length, 1)), [media.length]);

  React.useEffect(() => {
    if (!playing || hovered || media.length <= 1) return;
    const timer = window.setInterval(next, 4500);
    return () => window.clearInterval(timer);
  }, [playing, hovered, media.length, next]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!media.length) return null;
  const active = media[index];
  const video = isVideo(active);

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-dark-100 bg-dark-50 shadow-sm" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={(e) => setTouchStart(e.changedTouches[0]?.clientX ?? null)} onTouchEnd={(e) => { const end = e.changedTouches[0]?.clientX ?? touchStart ?? 0; if (touchStart !== null && Math.abs(end - touchStart) > 48) end < touchStart ? next() : prev(); setTouchStart(null); }}>
          <div key={active} className="relative flex h-full w-full items-center justify-center">
            {video ? <video src={active} controls muted playsInline preload="metadata" className="h-full w-full object-cover" aria-label={`${alt} video ${index + 1}`} /> : <SiteImage src={active} alt={`${alt} ${index + 1}`} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />}
          </div>
          {media.length > 1 && <><Button type="button" variant="secondary" size="icon" aria-label="Media sebelumnya" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg backdrop-blur-sm hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft /></Button><Button type="button" variant="secondary" size="icon" aria-label="Media berikutnya" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg backdrop-blur-sm hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><ChevronRight /></Button><div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/20 bg-dark-950/80 px-3 py-2 shadow-lg backdrop-blur">{media.map((_, i) => <button type="button" key={i} aria-label={`Media ${i + 1}`} onClick={() => setIndex(i)} className={cn("h-1.5 rounded-full", i === index ? "w-6 bg-white shadow-sm" : "w-1.5 bg-white/55 hover:bg-white/80")} />)}</div></>}
          <div className="absolute right-3 top-3 flex gap-2">{media.length > 1 && <Button type="button" variant="secondary" size="icon" aria-label={playing ? "Jeda slideshow" : "Putar slideshow"} onClick={() => setPlaying((v) => !v)} className="rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg backdrop-blur-sm hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white">{playing ? <Pause /> : <Play />}</Button>}<Button type="button" variant="secondary" size="icon" aria-label="Perbesar media" onClick={() => setLightbox(true)} className="rounded-full border border-white/30 bg-dark-950/85 text-white shadow-lg backdrop-blur-sm hover:bg-dark-950 focus-visible:ring-2 focus-visible:ring-white"><Expand /></Button></div>
        </div>
        {media.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{media.map((src, i) => <button type="button" key={`${src}-${i}`} onClick={() => setIndex(i)} className={cn("relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border", i === index ? "border-primary ring-2 ring-primary/20" : "border-dark-100 hover:border-dark-300")}>{isVideo(src) ? <><video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/20"><span className="rounded-full bg-white/90 p-1"><Play className="h-3 w-3 fill-current" /></span></span></> : <SiteImage src={src} alt={`${alt} thumbnail ${i + 1}`} fill sizes="80px" className="object-cover" />}</button>)}</div>}
      </div>
      {lightbox && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}><div className="relative h-[88vh] w-[94vw]" onClick={(e) => e.stopPropagation()}>{video ? <video src={active} controls autoPlay muted playsInline className="h-full w-full object-contain" /> : <SiteImage src={active} alt={`${alt} enlarged`} fill sizes="94vw" className="object-contain" />}<Button type="button" variant="secondary" size="icon" onClick={() => setLightbox(false)} aria-label="Tutup preview" className="absolute right-2 top-2 rounded-full">×</Button></div></div>}
    </>
  );
}

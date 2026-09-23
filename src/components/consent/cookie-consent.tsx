"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "madina-cookie-consent-v1";
type ConsentState = "unknown" | "accepted" | "declined";
let forceUnknown = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((listener) => listener()); }
function getSnapshot(): ConsentState {
  if (forceUnknown) return "unknown";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ConsentState | null;
    return saved === "accepted" || saved === "declined" ? saved : "unknown";
  } catch { return "unknown"; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => emit();
  const reopen = () => { forceUnknown = true; emit(); };
  const consent = () => { forceUnknown = false; emit(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("madina:open-cookie-preferences", reopen);
  window.addEventListener("madina:cookie-consent", consent);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); window.removeEventListener("madina:open-cookie-preferences", reopen); window.removeEventListener("madina:cookie-consent", consent); };
}

export function CookieConsent({ privacyHref = "/privacy" }: { privacyHref?: string }) {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, () => "unknown" as ConsentState);
  const choose = (next: Exclude<ConsentState, "unknown">) => {
    forceUnknown = false;
    try { window.localStorage.setItem(STORAGE_KEY, next); document.cookie = `madina_cookie_consent=${next}; Max-Age=31536000; Path=/; SameSite=Lax`; } catch {}
    window.dispatchEvent(new CustomEvent("madina:cookie-consent", { detail: next }));
    emit();
  };
  if (state !== "unknown") return null;
  return (
    <aside className="fixed inset-x-0 bottom-0 z-[80] border-t border-dark-200 bg-white/95 shadow-2xl backdrop-blur" aria-label="Persetujuan cookie">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex gap-3"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Cookie className="h-5 w-5" aria-hidden="true" /></div><div><p className="font-semibold text-dark-900">Privasi &amp; Cookie</p><p className="mt-1 max-w-3xl text-sm leading-6 text-dark-600">Kami menggunakan cookie yang diperlukan untuk fungsi dasar situs. Cookie non-esensial, termasuk teknologi iklan, hanya dijalankan setelah persetujuan Anda. <Link href={privacyHref} className="font-semibold text-primary hover:underline">Pelajari kebijakan privasi</Link>.</p></div></div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row"><button type="button" onClick={() => choose("declined")} className="rounded-xl border border-dark-200 px-4 py-2.5 text-sm font-semibold text-dark-700 hover:bg-dark-50">Tolak non-esensial</button><button type="button" onClick={() => choose("accepted")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-dark"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Terima Cookie</button></div>
      </div>
    </aside>
  );
}

export function CookiePreferencesButton({ className = "" }: { className?: string }) {
  return <button type="button" className={className} onClick={() => { forceUnknown = true; emit(); window.dispatchEvent(new Event("madina:open-cookie-preferences")); }}>Preferensi Cookie</button>;
}

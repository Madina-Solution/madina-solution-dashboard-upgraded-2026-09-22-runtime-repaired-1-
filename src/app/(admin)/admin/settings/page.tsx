"use client";

import * as React from "react";
import { Settings as SettingsIcon, Save, Loader2, Globe, CreditCard, HardDrive, Server, Mail, Megaphone, ShieldCheck, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { BRAND } from "@/lib/constants";
import { MediaUploader } from "@/components/ui/media-uploader";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";
import { SiteImage } from "@/components/ui/site-image";

type FormState = {
  siteName: string; siteTagline: string; siteLogo: string; siteIcon: string; siteEmail: string; sitePhone: string; siteAddress: string; siteWhatsapp: string; siteUrl: string;
  seoTitle: string; seoDescription: string; seoKeywords: string; seoOgImage: string; seoTwitterHandle: string;
  topbarEnabled: boolean; topbarText: string;
  heroBadge: string; heroTitle: string; heroDescription: string; heroImage: string; heroImageAlt: string; ctaTitle: string; ctaDescription: string; mapsEmbedUrl: string;
  adsenseEnabled: boolean; adsenseClient: string; adsensePublisherId: string; adsenseSlotTop: string; adsenseSlotFooter: string; adsenseSlotProduct: string; adsenseSlotArticle: string;
};
const INITIAL: FormState = { siteName: BRAND.name, siteTagline: BRAND.tagline, siteLogo: "", siteIcon: "", siteEmail: BRAND.email, sitePhone: "+62 813-9300-5035", siteAddress: BRAND.address, siteWhatsapp: BRAND.whatsapp, siteUrl: "", seoTitle: "", seoDescription: BRAND.description, seoKeywords: "Madina Solution, desain grafis, digital printing, branding, advertising, percetakan Temanggung", seoOgImage: "", seoTwitterHandle: "", topbarEnabled: true, topbarText: "Creative Business Platform untuk kebutuhan bisnis Anda", heroBadge: "", heroTitle: "", heroDescription: "", heroImage: "", heroImageAlt: "", ctaTitle: "", ctaDescription: "", mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.3671256912222!2d110.1555280331352!3d-7.2551769777527015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70795cfc6cf129%3A0xa0254c4ef1fe6d5f!2sJoglo%20Market!5e0!3m2!1sid!2sid!4v1788080189081!5m2!1sid!2sid", adsenseEnabled: false, adsenseClient: "", adsensePublisherId: "", adsenseSlotTop: "", adsenseSlotFooter: "", adsenseSlotProduct: "", adsenseSlotArticle: "" };

function getString(settings: Record<string, unknown>, key: string, fallback = "") {
  const raw = settings[key];
  const value = raw && typeof raw === "object" && "value" in raw ? (raw as { value?: unknown }).value : raw;
  return typeof value === "string" ? value : fallback;
}
function getBoolean(settings: Record<string, unknown>, key: string, fallback = false) {
  const raw = settings[key];
  const value = raw && typeof raw === "object" && "value" in raw ? (raw as { value?: unknown }).value : raw;
  return typeof value === "boolean" ? value : fallback;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<Record<string, unknown>>({});
  const [integrations, setIntegrations] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(INITIAL);

  const fetchSettings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings"); const data = await res.json();
      if (data.success) {
        setSettings(data.settings); setIntegrations((data.settings._integrations as Record<string, string>) || {});
        const s = data.settings as Record<string, unknown>;
        setForm({
          siteName: getString(s, "site_name", INITIAL.siteName), siteTagline: getString(s, "site_tagline", INITIAL.siteTagline), siteLogo: getString(s, "site_logo"), siteIcon: getString(s, "site_icon"), siteEmail: getString(s, "site_email", INITIAL.siteEmail), sitePhone: getString(s, "site_phone", INITIAL.sitePhone), siteAddress: getString(s, "site_address", INITIAL.siteAddress), siteWhatsapp: getString(s, "site_whatsapp", INITIAL.siteWhatsapp), siteUrl: getString(s, "site_url", window.location.origin), seoTitle: getString(s, "seo_title"), seoDescription: getString(s, "seo_description", INITIAL.seoDescription), seoKeywords: getString(s, "seo_keywords", INITIAL.seoKeywords), seoOgImage: getString(s, "seo_og_image"), seoTwitterHandle: getString(s, "seo_twitter_handle"),
          topbarEnabled: getBoolean(s, "topbar_enabled", true), topbarText: getString(s, "topbar_text", INITIAL.topbarText),
          heroBadge: getString(s, "hero_badge"), heroTitle: getString(s, "hero_title"), heroDescription: getString(s, "hero_description"), heroImage: getString(s, "hero_image"), heroImageAlt: getString(s, "hero_image_alt"), ctaTitle: getString(s, "cta_title"), ctaDescription: getString(s, "cta_description"), mapsEmbedUrl: getString(s, "maps_embed_url", INITIAL.mapsEmbedUrl),
          adsenseEnabled: getBoolean(s, "adsense_enabled", false), adsenseClient: getString(s, "adsense_client"), adsensePublisherId: getString(s, "adsense_publisher_id"), adsenseSlotTop: getString(s, "adsense_slot_top"), adsenseSlotFooter: getString(s, "adsense_slot_footer"), adsenseSlotProduct: getString(s, "adsense_slot_product"), adsenseSlotArticle: getString(s, "adsense_slot_article"),
        });
      }
    } catch { toast({ type: "error", title: "Pengaturan gagal dimuat" }); } finally { setIsLoading(false); }
  }, [toast]);

  // Initial data loading intentionally updates local form state from the API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries({
        site_name: form.siteName, site_tagline: form.siteTagline, site_logo: form.siteLogo, site_icon: form.siteIcon, site_email: form.siteEmail, site_phone: form.sitePhone, site_address: form.siteAddress, site_whatsapp: form.siteWhatsapp, site_url: form.siteUrl, seo_title: form.seoTitle, seo_description: form.seoDescription, seo_keywords: form.seoKeywords, seo_og_image: form.seoOgImage, seo_twitter_handle: form.seoTwitterHandle,
        topbar_enabled: form.topbarEnabled, topbar_text: form.topbarText, hero_badge: form.heroBadge, hero_title: form.heroTitle, hero_description: form.heroDescription, hero_image: form.heroImage, hero_image_alt: form.heroImageAlt, cta_title: form.ctaTitle, cta_description: form.ctaDescription, maps_embed_url: form.mapsEmbedUrl,
        adsense_enabled: form.adsenseEnabled, adsense_client: form.adsenseClient, adsense_publisher_id: form.adsensePublisherId, adsense_slot_top: form.adsenseSlotTop, adsense_slot_footer: form.adsenseSlotFooter, adsense_slot_product: form.adsenseSlotProduct, adsense_slot_article: form.adsenseSlotArticle,
      }).map(([key, value]) => [key, { value }]));
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error?.message || "Gagal menyimpan");
      toast({ type: "success", title: "Pengaturan berhasil disimpan" });
      await fetchSettings();
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menyimpan" }); } finally { setIsSaving(false); }
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400" /></div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-dark">Pengaturan Utama</h1><p className="mt-1 text-dark-500">Kelola branding, homepage, top bar, privasi, media dan monetisasi.</p></div><Button onClick={handleSave} isLoading={isSaving}><Save className="mr-2 h-4 w-4" />Simpan Semua</Button></div>

      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 font-semibold text-dark"><Globe className="h-5 w-5 text-primary" />Branding & Identitas</h2><p className="mt-1 text-sm text-dark-500">Nama dan logo di bawah akan digunakan pada header, mobile navigation dan metadata situs.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><label className="mb-1.5 block text-sm font-medium text-dark">Judul / Nama Situs</label><Input value={form.siteName} onChange={(e) => update("siteName", e.target.value)} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-dark">Tagline</label><Input value={form.siteTagline} onChange={(e) => update("siteTagline", e.target.value)} placeholder="Creative Business Platform" /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-dark">URL Utama</label><Input type="url" value={form.siteUrl} onChange={(e) => update("siteUrl", e.target.value)} placeholder="https://madinasolution.vercel.app" /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-dark">Email Situs</label><Input type="email" value={form.siteEmail} onChange={(e) => update("siteEmail", e.target.value)} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-dark">Telepon</label><Input value={form.sitePhone} onChange={(e) => update("sitePhone", e.target.value)} /></div>
        <div><label className="mb-1.5 block text-sm font-medium text-dark">WhatsApp</label><Input value={form.siteWhatsapp} onChange={(e) => update("siteWhatsapp", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Alamat</label><Input value={form.siteAddress} onChange={(e) => update("siteAddress", e.target.value)} /></div>
        <div className="sm:col-span-2"><MediaUploader value={form.siteLogo} onChange={(value) => update("siteLogo", Array.isArray(value) ? value[0] || "" : value)} purpose="site_logo" persist={{ endpoint: "/api/admin/settings", key: "site_logo", mode: "replace" }} label="Logo / Gambar Judul Situs" helpText="JPG, PNG, WEBP — upload baru langsung menggantikan logo aktif." /></div>
        <div className="sm:col-span-2"><MediaUploader value={form.siteIcon} onChange={(value) => update("siteIcon", Array.isArray(value) ? value[0] || "" : value)} purpose="site_app_icon" persist={{ endpoint: "/api/admin/settings", key: "site_icon", mode: "replace" }} label="App Icon / Favicon" helpText="Gunakan PNG 512×512 dengan komposisi square. Dipakai untuk favicon, Android/PWA, dan Apple icon." /></div>
        {form.siteLogo ? <div className="sm:col-span-2 rounded-2xl border border-dark-100 bg-dark-50 p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-500">Preview Header</p><div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"><div className="relative h-12 w-12 shrink-0 overflow-hidden"><SiteImage src={form.siteLogo} alt={form.siteName} fill sizes="48px" className="object-contain" /></div><div><p className="font-bold text-dark-900">{form.siteName}</p><p className="text-xs text-dark-500">{form.siteTagline}</p></div></div></div> : null}
      </div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 font-semibold text-dark"><Globe className="h-5 w-5 text-primary" />SEO & Social Sharing</h2><p className="mt-1 text-sm text-dark-500">Kelola title, meta description, keyword, Open Graph image, dan akun sosial tanpa mengubah source code.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-medium text-dark">SEO Title</label><Input value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} placeholder="Madina Solution — Creative Business Platform" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Twitter / X Handle</label><Input value={form.seoTwitterHandle} onChange={(e) => update("seoTwitterHandle", e.target.value)} placeholder="@madinasolution" /></div><div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">Meta Description</label><textarea value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} rows={3} maxLength={160} className="w-full rounded-xl border border-dark-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" /></div><div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-medium text-dark">SEO Keywords</label><Input value={form.seoKeywords} onChange={(e) => update("seoKeywords", e.target.value)} placeholder="desain grafis, digital printing, branding, Temanggung" /></div><div className="sm:col-span-2"><MediaUploader value={form.seoOgImage} onChange={(value) => update("seoOgImage", Array.isArray(value) ? value[0] || "" : value)} purpose="article_image" persist={{ endpoint: "/api/admin/settings", key: "seo_og_image", mode: "replace" }} label="Open Graph Image" helpText="Rekomendasi 1200×630 px. Dipakai untuk share WhatsApp, Facebook, LinkedIn, dan fallback Twitter." /></div></div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 font-semibold text-dark"><PanelTop className="h-5 w-5 text-primary" />Top Bar</h2><p className="mt-1 text-sm text-dark-500">Tampilkan atau sembunyikan bar informasi di atas header desktop.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-dark-100 p-4"><input type="checkbox" checked={form.topbarEnabled} onChange={(e) => update("topbarEnabled", e.target.checked)} className="h-4 w-4 rounded border-dark-300 text-primary focus:ring-primary/20" /><span><span className="block font-medium text-dark">Top bar aktif</span><span className="text-xs text-dark-500">Terlihat pada layar desktop.</span></span></label><div><label className="mb-1.5 block text-sm font-medium text-dark">Teks top bar</label><Input value={form.topbarText} onChange={(e) => update("topbarText", e.target.value)} /></div></div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="font-semibold text-dark">Homepage & Hero</h2><p className="mt-1 text-sm text-dark-500">Konten ini tidak lagi harus diubah melalui source code.</p><div className="mt-4 grid gap-4"><Input aria-label="Badge Hero" value={form.heroBadge} onChange={(e) => update("heroBadge", e.target.value)} placeholder="Badge Hero" /><Input aria-label="Judul Hero" value={form.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} placeholder="Judul Hero" /><RichTextEditor label="Deskripsi Hero" value={form.heroDescription} onChange={(heroDescription) => update("heroDescription", heroDescription)} minHeight={220} /><MediaUploader value={form.heroImage} onChange={(value) => update("heroImage", Array.isArray(value) ? value[0] || "" : value)} purpose="site_hero" persist={{ endpoint: "/api/admin/settings", key: "hero_image", mode: "replace" }} label="Hero Image / Video" helpText="Gambar atau video hero homepage." allowVideo /><Input aria-label="Alt Hero" value={form.heroImageAlt} onChange={(e) => update("heroImageAlt", e.target.value)} placeholder="Alt text hero" /><Input aria-label="CTA title" value={form.ctaTitle} onChange={(e) => update("ctaTitle", e.target.value)} placeholder="Judul CTA" /><Input aria-label="CTA description" value={form.ctaDescription} onChange={(e) => update("ctaDescription", e.target.value)} placeholder="Deskripsi CTA" /></div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="font-semibold text-dark">Lokasi Google Maps</h2><p className="mt-1 text-sm text-dark-500">URL embed Google Maps disimpan sebagai konfigurasi situs dan digunakan pada halaman Kontak.</p><div className="mt-4 space-y-4"><Input value={form.mapsEmbedUrl} onChange={(e) => update("mapsEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." /><div className="overflow-hidden rounded-2xl border border-dark-100 bg-dark-50">{form.mapsEmbedUrl ? <iframe src={form.mapsEmbedUrl} title="Preview Google Maps" className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="flex h-40 items-center justify-center text-sm text-dark-400">Masukkan URL embed untuk menampilkan preview.</div>}</div></div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 font-semibold text-dark"><Megaphone className="h-5 w-5 text-primary" />Google AdSense</h2><p className="mt-1 text-sm text-dark-500">Tempatkan unit iklan secara terkontrol. Posisi default yang disediakan: setelah header dan sebelum footer; slot khusus juga tersedia untuk produk dan artikel.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-dark-100 p-4 sm:col-span-2"><input type="checkbox" checked={form.adsenseEnabled} onChange={(e) => update("adsenseEnabled", e.target.checked)} className="h-4 w-4 rounded border-dark-300 text-primary focus:ring-primary/20" /><span><span className="block font-medium text-dark">Aktifkan AdSense</span><span className="text-xs text-dark-500">Iklan hanya dimuat setelah persetujuan cookie non-esensial.</span></span></label><div><label className="mb-1.5 block text-sm font-medium text-dark">AdSense Client</label><Input value={form.adsenseClient} onChange={(e) => update("adsenseClient", e.target.value)} placeholder="ca-pub-xxxxxxxxxxxxxxxx" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Publisher ID</label><Input value={form.adsensePublisherId} onChange={(e) => update("adsensePublisherId", e.target.value)} placeholder="pub-xxxxxxxxxxxxxxxx" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Slot Top</label><Input value={form.adsenseSlotTop} onChange={(e) => update("adsenseSlotTop", e.target.value)} placeholder="ID unit iklan" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Slot Footer</label><Input value={form.adsenseSlotFooter} onChange={(e) => update("adsenseSlotFooter", e.target.value)} placeholder="ID unit iklan" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Slot Produk</label><Input value={form.adsenseSlotProduct} onChange={(e) => update("adsenseSlotProduct", e.target.value)} placeholder="ID unit iklan" /></div><div><label className="mb-1.5 block text-sm font-medium text-dark">Slot Artikel</label><Input value={form.adsenseSlotArticle} onChange={(e) => update("adsenseSlotArticle", e.target.value)} placeholder="ID unit iklan" /></div></div><div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="mr-2 inline h-4 w-4" />Untuk traffic EEA, UK, atau Swiss, Google memiliki persyaratan consent tersendiri; gunakan CMP bersertifikat Google bila menayangkan personalized ads. </div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 font-semibold text-dark"><Server className="h-5 w-5 text-primary" />Status Integrasi</h2><div className="mt-4 space-y-3">{[
  { Icon: CreditCard, label: "Payment", status: integrations.payment === "mock" ? "Development" : integrations.payment || "—" },
  { Icon: HardDrive, label: "Storage", status: integrations.storage || "—" },
  { Icon: Mail, label: "Email", status: integrations.email === "configured" ? "Aktif" : "Belum dikonfigurasi" },
  { Icon: ShieldCheck, label: "Firebase Auth", status: integrations.firebase === "configured" ? "Aktif" : "Belum dikonfigurasi" },
  { Icon: Server, label: "Database", status: "Connected" },
].map(({ Icon, label, status }) => (
  <div key={label} className="flex items-center justify-between rounded-xl border border-dark-100 p-4">
    <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-dark-500" /><div><p className="font-medium text-dark">{label}</p><p className="text-xs text-dark-500">Status layanan</p></div></div>
    <Badge variant={String(status).toLowerCase().includes("belum") || status === "Development" ? "warning" : "success"}>{status}</Badge>
  </div>
))}</div></CardContent></Card>

      <div className="flex justify-end"><Button size="lg" onClick={handleSave} isLoading={isSaving}><SettingsIcon className="mr-2 h-4 w-4" />Simpan Semua Pengaturan</Button></div>
    </div>
  );
}

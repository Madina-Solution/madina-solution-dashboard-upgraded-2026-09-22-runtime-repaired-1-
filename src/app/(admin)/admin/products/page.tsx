"use client";

import * as React from "react";
import {
  Plus, Pencil, Trash2, Loader2, Package, Star, Search, Settings2, Globe2,
  Boxes, Truck, Tags, BarChart3, Save, X, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaUploader } from "@/components/ui/media-uploader";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { SiteImage } from "@/components/ui/site-image";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { OptionsEditor } from "@/components/admin/options-editor";
import { RichTextEditor } from "@/components/admin/wysiwyg-editor";
import type { ProductAdminMetadata, ProductOption } from "@/db/schema";

type Product = {
  id: string; name: string; slug: string; basePrice: string; unit: string | null;
  isFeatured: boolean | null; isActive: boolean; shortDescription: string | null;
  categoryId: string | null; thumbnail: string | null; createdAt: string;
};
type Category = { id: string; name: string; slug: string };
type WholesaleTier = { minQuantity: number; unitPrice: string };
type VariantAttribute = { name: string; values: { label: string; value: string; priceModifier?: number; sku?: string; stock?: number; image?: string }[] };

type ProductTranslationForm = { name: string; shortDescription: string; description: string };
type ProductForm = {
  name: string; slug: string; categoryId: string; shortDescription: string; description: string;
  basePrice: string; unit: string; minOrder: number; productionDays: number; isFeatured: boolean; isActive: boolean;
  thumbnail: string; gallery: string[]; options: ProductOption[]; fulfillmentType: "physical" | "digital" | "hybrid";
  specifications: Record<string, string>; metadata: ProductAdminMetadata; translations: { id: ProductTranslationForm; en: ProductTranslationForm };
};

const DEFAULT_META: ProductAdminMetadata = {
  condition: "new",
  stock: { status: "made_to_order", quantity: 0, lowStock: 5 },
  pricing: { compareAtPrice: "", costPrice: "", wholesaleTiers: [] },
  shipping: { weightGrams: 0, lengthCm: 0, widthCm: 0, heightCm: 0, shippingClass: "", origin: "", leadTimeDays: 3, freeShipping: false },
  content: { highlights: [""], tags: [], faq: [], videoUrl: "", warranty: "", returnPolicy: "", relatedProductIds: [] },
  seo: { title: "", description: "", keywords: [], canonicalUrl: "", noIndex: false, ogTitle: "", ogDescription: "", ogImage: "", twitterTitle: "", twitterDescription: "" },
  schema: { mpn: "", gtin: "" },
  marketing: { badge: "", promoText: "", campaign: "" },
  variants: { enabled: false, attributes: [] },
};

const EMPTY_FORM: ProductForm = {
  name: "", slug: "", categoryId: "", shortDescription: "", description: "", basePrice: "", unit: "pcs",
  minOrder: 1, productionDays: 3, isFeatured: false, isActive: true, thumbnail: "", gallery: [], options: [],
  fulfillmentType: "physical", specifications: {}, metadata: DEFAULT_META,
  translations: { id: { name: "", shortDescription: "", description: "" }, en: { name: "", shortDescription: "", description: "" } },
};

const deepClone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"general"|"content"|"pricing"|"inventory"|"shipping"|"seo"|"variants">("general");
  const [form, setForm] = React.useState<ProductForm>(deepClone(EMPTY_FORM));
  const [languageTab, setLanguageTab] = React.useState<"id" | "en">("id");

  const reloadData = React.useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([fetch("/api/admin/products/list"), fetch("/api/admin/categories")]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      if (prodData.success) setProducts(prodData.products);
      if (catData.success) setCategories(catData.categories);
      return true;
    } catch {
      toast({ type: "error", title: "Gagal memuat data produk" });
      return false;
    }
  }, [toast]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([fetch("/api/admin/products/list"), fetch("/api/admin/categories")]);
        const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
        if (cancelled) return;
        if (prodData.success) setProducts(prodData.products);
        if (catData.success) setCategories(catData.categories);
      } catch {
        if (!cancelled) toast({ type: "error", title: "Gagal memuat data produk" });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [toast]);

  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [products, search]);

  const setMeta = <K extends keyof ProductAdminMetadata>(section: K, value: ProductAdminMetadata[K]) =>
    setForm((p) => ({ ...p, metadata: { ...p.metadata, [section]: value } }));

  const updateMeta = <K extends keyof ProductAdminMetadata>(section: K, patch: Partial<NonNullable<ProductAdminMetadata[K]>>) =>
    setForm((p) => ({ ...p, metadata: { ...p.metadata, [section]: { ...(typeof p.metadata[section] === "object" && p.metadata[section] !== null ? p.metadata[section] : {}), ...patch } } }));

  const resetForm = () => {
    setShowForm(false); setEditId(null); setActiveTab("general"); setForm(deepClone(EMPTY_FORM));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.basePrice.trim()) {
      toast({ type: "error", title: "Nama, slug, dan harga wajib diisi" }); setActiveTab("general"); return;
    }
    setIsSaving(true);
    try {
      const url = editId ? `/api/admin/products/${editId}` : "/api/admin/products";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || undefined,
          metadata: form.metadata,
          specifications: form.specifications,
          translations: form.translations,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Gagal menyimpan");
      toast({ type: "success", title: editId ? "Produk diperbarui" : "Produk dibuat" });
      resetForm();
      await reloadData();
    } catch (error) {
      toast({ type: "error", title: error instanceof Error ? error.message : "Gagal menyimpan produk" });
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Gagal");
      toast({ type: "success", title: "Produk dinonaktifkan" });
      await reloadData();
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal" }); }
    finally { setIsDeleting(false); setDeleteTarget(null); }
  };

  const handleToggle = async (id: string, field: "isActive" | "isFeatured", value: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: !value }) });
      const data = await res.json();
      if (!data.success) throw new Error();
      await reloadData();
    } catch { toast({ type: "error", title: "Gagal memperbarui produk" }); }
  };

  const startEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`); const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || "Produk tidak ditemukan");
      const p = data.product;
      setForm({
        name: p.name, slug: p.slug, categoryId: p.categoryId || "", shortDescription: p.shortDescription || "",
        description: p.description || "", basePrice: p.basePrice, unit: p.unit || "pcs", minOrder: p.minOrder || 1,
        productionDays: p.productionDays || 3, isFeatured: !!p.isFeatured, isActive: !!p.isActive,
        thumbnail: p.thumbnail || "", gallery: Array.isArray(p.gallery) ? p.gallery : [], options: Array.isArray(p.options) ? p.options : [],
        fulfillmentType: p.fulfillmentType || "physical", specifications: p.specifications || {},
        translations: { id: { ...deepClone(EMPTY_FORM.translations.id), ...(p.translations?.id || {}) }, en: { ...deepClone(EMPTY_FORM.translations.en), ...(p.translations?.en || {}) } },
        metadata: { ...deepClone(DEFAULT_META), ...(p.metadata || {}),
          pricing: { ...DEFAULT_META.pricing, ...(p.metadata?.pricing || {}) },
          stock: { ...DEFAULT_META.stock, ...(p.metadata?.stock || {}) },
          shipping: { ...DEFAULT_META.shipping, ...(p.metadata?.shipping || {}) },
          content: { ...DEFAULT_META.content, ...(p.metadata?.content || {}) },
          seo: { ...DEFAULT_META.seo, ...(p.metadata?.seo || {}) },
          schema: { ...DEFAULT_META.schema, ...(p.metadata?.schema || {}) },
          marketing: { ...DEFAULT_META.marketing, ...(p.metadata?.marketing || {}) },
          variants: { ...DEFAULT_META.variants, ...(p.metadata?.variants || {}) },
        },
      });
      setEditId(id); setShowForm(true); setActiveTab("general");
    } catch (error) { toast({ type: "error", title: error instanceof Error ? error.message : "Gagal membuka produk" }); }
  };

  const tabs = [
    ["general","Umum",Settings2],["content","Konten",Sparkles],["pricing","Harga",BarChart3],["inventory","Stok",Boxes],
    ["shipping","Pengiriman",Truck],["seo","SEO",Globe2],["variants","Varian",Tags],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-dark">Produk & Product Information Management</h1><p className="mt-1 text-sm text-dark-500">{filteredProducts.length} produk • editor lengkap untuk storefront modern</p></div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400"/><Input aria-label="Cari produk" placeholder="Cari nama atau slug…" value={search} onChange={(e)=>setSearch(e.target.value)} className="pl-9"/></div>
          <Button onClick={()=>{resetForm();setShowForm(true)}}><Plus className="mr-2 h-4 w-4"/>Tambah</Button>
        </div>
      </header>

      {showForm && (
        <Card className="overflow-hidden">
          <div className="flex flex-col border-b border-dark-100 bg-dark-50/70 px-4 pt-3 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="px-1 pb-1 text-lg font-bold text-dark">{editId ? "Edit Produk" : "Tambah Produk"}</div><p className="px-1 pb-3 text-xs text-dark-500">Kelola konten, merchandising, SEO, harga grosir, stok, pengiriman, dan varian dari satu editor.</p></div>
            <nav className="flex gap-1 overflow-x-auto" aria-label="Pengaturan produk">
              {tabs.map(([id,label,Icon]) => <button key={id} type="button" onClick={()=>setActiveTab(id)} aria-current={activeTab===id?"page":undefined}
                className={`flex shrink-0 items-center gap-2 rounded-t-xl px-3 py-2.5 text-xs font-semibold ${activeTab===id?"bg-white text-primary shadow-sm":"text-dark-500 hover:bg-white/70"}`}><Icon className="h-4 w-4"/>{label}</button>)}
            </nav>
          </div>

          <CardContent className="p-5 lg:p-7">
            {activeTab === "general" && (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nama produk *"><Input value={form.name} onChange={(e)=>setForm(p=>({...p,name:e.target.value,slug:editId?p.slug:slugify(e.target.value)}))} placeholder="Banner Flexi 280gsm"/></Field>
                    <Field label="Slug *"><Input value={form.slug} onChange={(e)=>setForm(p=>({...p,slug:slugify(e.target.value)}))} placeholder="banner-flexi-280gsm"/></Field>
                    <Field label="Kategori"><select value={form.categoryId} onChange={(e)=>setForm(p=>({...p,categoryId:e.target.value}))} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm"><option value="">— Tanpa kategori —</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                    <Field label="Brand"><Input value={form.metadata.brand || ""} onChange={(e)=>setMeta("brand",e.target.value)} placeholder="Madina Solution"/></Field>
                    <Field label="SKU"><Input value={form.metadata.sku || ""} onChange={(e)=>setMeta("sku",e.target.value)} placeholder="BNR-FLX-001"/></Field>
                    <Field label="Barcode / GTIN"><Input value={form.metadata.barcode || ""} onChange={(e)=>setMeta("barcode",e.target.value)} placeholder="Opsional"/></Field>
                    <Field label="Harga dasar *"><Input inputMode="decimal" value={form.basePrice} onChange={(e)=>setForm(p=>({...p,basePrice:e.target.value.replace(/[^0-9.]/g,"")}))} placeholder="25000"/></Field>
                    <Field label="Satuan"><Input value={form.unit} onChange={(e)=>setForm(p=>({...p,unit:e.target.value}))} placeholder="pcs"/></Field>
                    <Field label="Minimum order"><Input type="number" min={1} value={form.minOrder} onChange={(e)=>setForm(p=>({...p,minOrder:Math.max(1,Number(e.target.value)||1)}))}/></Field>
                  </div>
                  <div className="rounded-2xl border border-dark-100 bg-dark-50/40 p-4 sm:col-span-2">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Content languages</p><p className="mt-1 text-xs text-dark-500">Pisahkan konten Indonesia dan English di database. Field utama tetap kompatibel dengan data lama.</p></div>
                      <div className="flex rounded-xl border border-dark-200 bg-white p-1" role="tablist" aria-label="Bahasa konten produk">
                        <button type="button" role="tab" aria-selected={languageTab === "id"} onClick={()=>setLanguageTab("id")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab === "id" ? "bg-dark-900 text-white" : "text-dark-500"}`}>Bahasa Indonesia</button>
                        <button type="button" role="tab" aria-selected={languageTab === "en"} onClick={()=>setLanguageTab("en")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${languageTab === "en" ? "bg-dark-900 text-white" : "text-dark-500"}`}>English</button>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={languageTab === "en" ? "English name" : "Nama Indonesia"}><Input value={form.translations[languageTab].name} onChange={(e)=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],name:e.target.value}}}))} placeholder={languageTab === "en" ? "Premium Vinyl Banner" : "Banner Vinyl Premium"}/></Field>
                      <Field label={languageTab === "en" ? "English short description" : "Deskripsi singkat Indonesia"}><Input value={form.translations[languageTab].shortDescription} onChange={(e)=>setForm(p=>({...p,translations:{...p.translations,[languageTab]:{...p.translations[languageTab],shortDescription:e.target.value}}}))} maxLength={500}/></Field>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-xl border border-dark-200 p-3 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm(p=>({...p,isActive:e.target.checked}))}/><span>Aktif</span></label>
                    <label className="flex items-center gap-2 rounded-xl border border-dark-200 p-3 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e)=>setForm(p=>({...p,isFeatured:e.target.checked}))}/><span>Produk unggulan</span></label>
                    <Field label="Pengerjaan (hari)"><Input type="number" min={1} value={form.productionDays} onChange={(e)=>setForm(p=>({...p,productionDays:Math.max(1,Number(e.target.value)||1)}))}/></Field>
                  </div>
                </div>
                <div className="space-y-4 lg:col-span-1">
                  <MediaUploader value={form.thumbnail} onChange={(v)=>setForm(p=>({...p,thumbnail:Array.isArray(v)?v[0]||"":v}))} purpose="product_image" label="Thumbnail utama" allowVideo persist={editId ? {endpoint:`/api/admin/products/${editId}`,key:"thumbnail",mode:"replace",method:"PATCH"}:undefined}/>
                  <MediaUploader value={form.gallery} onChange={(v)=>setForm(p=>({...p,gallery:Array.isArray(v)?v:(v?[v]:[])}))} purpose="product_image" label="Gallery / media" multiple maxFiles={20} allowVideo helpText="Foto 1:1, 4:3, video pendek, infografik, packaging, close-up, dll." persist={editId ? {endpoint:`/api/admin/products/${editId}`,key:"gallery",mode:"replace",method:"PATCH"}:undefined}/>
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Fulfillment</p><select value={form.fulfillmentType} onChange={(e)=>setForm(p=>({...p,fulfillmentType:e.target.value as ProductForm["fulfillmentType"]}))} className="mt-2 h-11 w-full rounded-xl border border-dark-200 bg-white px-3 text-sm"><option value="physical">Fisik</option><option value="digital">Digital</option><option value="hybrid">Hybrid</option></select></div>
                </div>
              </div>
            )}

            {activeTab === "content" && (
              <div className="space-y-6">
                <RichTextEditor label="Deskripsi lengkap / product story" helpText="HTML bersih untuk landing-style product detail. Mendukung heading, list, link, image, tabel, quote, code, fullscreen, dan HTML source." value={form.description} onChange={(description)=>setForm(p=>({...p,description}))} minHeight={420}/>
                <div className="rounded-2xl border border-dark-100 bg-dark-50/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-dark">English rich content</p><p className="mt-1 text-xs text-dark-500">Disimpan pada <code>products.translations.en.description</code>.</p></div><Badge variant="secondary">EN</Badge></div>
                  <RichTextEditor label="English product story" value={form.translations.en.description} onChange={(description)=>setForm(p=>({...p,translations:{...p.translations,en:{...p.translations.en,description}}}))} minHeight={320} placeholder="Write the English product story…"/>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Card><CardContent className="p-5">
                    <h3 className="font-semibold text-dark">Highlight produk</h3>
                    <p className="mt-1 text-xs text-dark-500">Poin keunggulan yang tampil sebagai selling points.</p>
                    <div className="mt-3 space-y-2">
                      {(form.metadata.content?.highlights || [""]).map((v,i)=>(
                        <div key={i} className="flex gap-2">
                          <Input value={v} onChange={(e)=>{const a=[...(form.metadata.content?.highlights||[])];a[i]=e.target.value;updateMeta("content",{highlights:a})}} placeholder="Tahan air / bahan premium / cetak cepat"/>
                          <Button type="button" size="icon" variant="ghost" onClick={()=>updateMeta("content",{highlights:(form.metadata.content?.highlights||[]).filter((_,x)=>x!==i)})} aria-label="Hapus highlight"><X className="h-4 w-4"/></Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={()=>updateMeta("content",{highlights:[...(form.metadata.content?.highlights||[]),""]})}><Plus className="mr-1 h-4 w-4"/>Tambah highlight</Button>
                  </CardContent></Card>
                  <Card><CardContent className="p-5">
                    <h3 className="font-semibold text-dark">FAQ & kebijakan</h3>
                    <div className="mt-3 space-y-3">
                      {(form.metadata.content?.faq||[]).map((item,i)=>(
                        <div className="rounded-xl border border-dark-200 p-3" key={i}>
                          <Input placeholder="Pertanyaan" value={item.question} onChange={(e)=>{const a=[...(form.metadata.content?.faq||[])];a[i]={...a[i],question:e.target.value};updateMeta("content",{faq:a})}}/>
                          <Input className="mt-2" placeholder="Jawaban" value={item.answer} onChange={(e)=>{const a=[...(form.metadata.content?.faq||[])];a[i]={...a[i],answer:e.target.value};updateMeta("content",{faq:a})}}/>
                          <Button className="mt-2" type="button" size="sm" variant="ghost" onClick={()=>updateMeta("content",{faq:(form.metadata.content?.faq||[]).filter((_,x)=>x!==i)})}>Hapus</Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={()=>updateMeta("content",{faq:[...(form.metadata.content?.faq||[]),{question:"",answer:""}]})}><Plus className="mr-1 h-4 w-4"/>Tambah FAQ</Button>
                  </CardContent></Card>
                </div>
                <OptionsEditor value={form.options} onChange={(options)=>setForm(p=>({...p,options}))}/>
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <Card><CardContent className="p-5">
                  <h3 className="font-semibold text-dark">Pricing engine</h3>
                  <p className="mt-1 text-xs text-dark-500">Harga core + compare-at + biaya internal + price breaks.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Harga core"><Input value={form.basePrice} onChange={(e)=>setForm(p=>({...p,basePrice:e.target.value}))}/></Field>
                    <Field label="Compare-at / harga normal"><Input value={form.metadata.pricing?.compareAtPrice||""} onChange={(e)=>updateMeta("pricing",{compareAtPrice:e.target.value})}/></Field>
                    <Field label="Harga pokok internal"><Input value={form.metadata.pricing?.costPrice||""} onChange={(e)=>updateMeta("pricing",{costPrice:e.target.value})}/></Field>
                    <Field label="Promo badge"><Input value={form.metadata.marketing?.badge||""} onChange={(e)=>updateMeta("marketing",{badge:e.target.value})} placeholder="BEST SELLER"/></Field>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="p-5">
                  <h3 className="font-semibold text-dark">Harga grosir / tier pricing</h3>
                  <div className="mt-3 space-y-2">
                    {(form.metadata.pricing?.wholesaleTiers||[]).map((tier,i)=>(
                      <div className="grid gap-2 rounded-2xl border border-dark-100 bg-dark-50/50 p-3 sm:grid-cols-[.9fr_.9fr_1fr_auto]" key={i}>
                        <Input type="number" min={1} value={tier.minQuantity} onChange={(e)=>{const a=[...(form.metadata.pricing?.wholesaleTiers||[])];a[i]={...a[i],minQuantity:Number(e.target.value)||1};updateMeta("pricing",{wholesaleTiers:a})}} placeholder="Min qty" aria-label={`Minimum quantity tier ${i+1}`}/>
                        <Input type="number" min={1} value={tier.maxQuantity ?? ""} onChange={(e)=>{const a=[...(form.metadata.pricing?.wholesaleTiers||[])];a[i]={...a[i],maxQuantity:e.target.value ? Number(e.target.value) : undefined};updateMeta("pricing",{wholesaleTiers:a})}} placeholder="Max qty" aria-label={`Maximum quantity tier ${i+1}`}/>
                        <div className="grid grid-cols-2 gap-2"><Input value={tier.unitPrice} onChange={(e)=>{const a=[...(form.metadata.pricing?.wholesaleTiers||[])];a[i]={...a[i],unitPrice:e.target.value};updateMeta("pricing",{wholesaleTiers:a})}} placeholder="Harga/unit" aria-label={`Harga tier ${i+1}`}/><Input value={tier.label || ""} onChange={(e)=>{const a=[...(form.metadata.pricing?.wholesaleTiers||[])];a[i]={...a[i],label:e.target.value};updateMeta("pricing",{wholesaleTiers:a})}} placeholder="Label" aria-label={`Label tier ${i+1}`}/></div>
                        <Button type="button" size="icon" variant="ghost" onClick={()=>updateMeta("pricing",{wholesaleTiers:(form.metadata.pricing?.wholesaleTiers||[]).filter((_,x)=>x!==i)})} aria-label="Hapus tier"><X className="h-4 w-4"/></Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={()=>updateMeta("pricing",{wholesaleTiers:[...(form.metadata.pricing?.wholesaleTiers||[]),{minQuantity:10,maxQuantity:undefined,unitPrice:"",label:""}]})}><Plus className="mr-1 h-4 w-4"/>Tambah tier harga</Button>
                </CardContent></Card>
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Status stok"><select value={form.metadata.stock?.status||"made_to_order"} onChange={(e)=>updateMeta("stock",{status:e.target.value as NonNullable<ProductAdminMetadata["stock"]>["status"]})} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm"><option value="in_stock">Stok tersedia</option><option value="out_of_stock">Habis</option><option value="preorder">Pre-order</option><option value="made_to_order">Made to order</option></select></Field>
                <Field label="Jumlah stok"><Input type="number" min={0} value={form.metadata.stock?.quantity ?? 0} onChange={(e)=>updateMeta("stock",{quantity:Math.max(0,Number(e.target.value)||0)})}/></Field>
                <Field label="Low-stock threshold"><Input type="number" min={0} value={form.metadata.stock?.lowStock ?? 5} onChange={(e)=>updateMeta("stock",{lowStock:Math.max(0,Number(e.target.value)||0)})}/></Field>
                <Field label="Kondisi"><select value={form.metadata.condition||"new"} onChange={(e)=>setMeta("condition",e.target.value as ProductAdminMetadata["condition"])} className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4"><option value="new">Baru</option><option value="used">Bekas</option><option value="refurbished">Refurbished</option></select></Field>
                <Field label="Keterangan stok / promo" className="md:col-span-2"><Input value={form.metadata.marketing?.promoText||""} onChange={(e)=>updateMeta("marketing",{promoText:e.target.value})} placeholder="Produksi 1–3 hari • Bisa custom ukuran"/></Field>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Berat (gram)"><Input type="number" min={0} value={form.metadata.shipping?.weightGrams ?? 0} onChange={(e)=>updateMeta("shipping",{weightGrams:Number(e.target.value)||0})}/></Field>
                <Field label="Asal pengiriman"><Input value={form.metadata.shipping?.origin||""} onChange={(e)=>updateMeta("shipping",{origin:e.target.value})} placeholder="Kedu, Temanggung"/></Field>
                <Field label="Panjang (cm)"><Input type="number" min={0} value={form.metadata.shipping?.lengthCm ?? 0} onChange={(e)=>updateMeta("shipping",{lengthCm:Number(e.target.value)||0})}/></Field>
                <Field label="Lebar (cm)"><Input type="number" min={0} value={form.metadata.shipping?.widthCm ?? 0} onChange={(e)=>updateMeta("shipping",{widthCm:Number(e.target.value)||0})}/></Field>
                <Field label="Tinggi (cm)"><Input type="number" min={0} value={form.metadata.shipping?.heightCm ?? 0} onChange={(e)=>updateMeta("shipping",{heightCm:Number(e.target.value)||0})}/></Field>
                <Field label="Lead time tambahan (hari)"><Input type="number" min={0} value={form.metadata.shipping?.leadTimeDays ?? form.productionDays} onChange={(e)=>updateMeta("shipping",{leadTimeDays:Math.max(0,Number(e.target.value)||0)})}/></Field>
                <Field label="Kelas pengiriman"><Input value={form.metadata.shipping?.shippingClass||""} onChange={(e)=>updateMeta("shipping",{shippingClass:e.target.value})} placeholder="Reguler / Express"/></Field>
                <label className="flex items-center gap-2 rounded-xl border border-dark-200 p-3 text-sm"><input type="checkbox" checked={!!form.metadata.shipping?.freeShipping} onChange={(e)=>updateMeta("shipping",{freeShipping:e.target.checked})}/> Gratis ongkir untuk produk ini</label>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4"><Field label="SEO title"><Input value={form.metadata.seo?.title||""} maxLength={65} onChange={(e)=>updateMeta("seo",{title:e.target.value})}/><Counter value={form.metadata.seo?.title||""} max={65}/></Field>
                  <Field label="Meta description"><textarea value={form.metadata.seo?.description||""} maxLength={160} onChange={(e)=>updateMeta("seo",{description:e.target.value})} rows={4} className="w-full rounded-xl border border-dark-200 p-3 text-sm"/><Counter value={form.metadata.seo?.description||""} max={160}/></Field>
                  <Field label="Keywords"><Input value={(form.metadata.seo?.keywords||[]).join(", ")} onChange={(e)=>updateMeta("seo",{keywords:e.target.value.split(",").map(v=>v.trim()).filter(Boolean).slice(0,30)})} placeholder="percetakan, banner, cetak banner"/></Field>
                  <Field label="Canonical URL"><Input value={form.metadata.seo?.canonicalUrl||""} onChange={(e)=>updateMeta("seo",{canonicalUrl:e.target.value})} placeholder="https://…/products/slug"/></Field>
                  <label className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><input type="checkbox" checked={!!form.metadata.seo?.noIndex} onChange={(e)=>updateMeta("seo",{noIndex:e.target.checked})}/> Jangan indeks halaman ini</label>
                </div>
                <Card><CardContent className="p-5"><h3 className="font-semibold text-dark">Social & Structured Data</h3><div className="mt-4 space-y-4">
                  <Field label="OpenGraph title"><Input value={form.metadata.seo?.ogTitle||""} onChange={(e)=>updateMeta("seo",{ogTitle:e.target.value})}/></Field>
                  <Field label="OpenGraph description"><textarea value={form.metadata.seo?.ogDescription||""} onChange={(e)=>updateMeta("seo",{ogDescription:e.target.value})} rows={3} className="w-full rounded-xl border border-dark-200 p-3 text-sm"/></Field>
                  <Field label="OpenGraph image"><Input value={form.metadata.seo?.ogImage||""} onChange={(e)=>updateMeta("seo",{ogImage:e.target.value})}/></Field>
                  <div className="grid gap-4 sm:grid-cols-2"><Field label="MPN"><Input value={form.metadata.schema?.mpn||""} onChange={(e)=>updateMeta("schema",{mpn:e.target.value})}/></Field><Field label="GTIN"><Input value={form.metadata.schema?.gtin||form.metadata.barcode||""} onChange={(e)=>updateMeta("schema",{gtin:e.target.value})}/></Field></div>
                  <div className="rounded-xl bg-dark-50 p-4 text-xs text-dark-500">Structured Product JSON-LD dapat mengambil SKU, GTIN, brand, harga, availability, rating, serta canonical dari data produk ini.</div>
                </div></CardContent></Card>
              </div>
            )}

            {activeTab === "variants" && (
              <VariantBuilder value={form.metadata.variants} onChange={(variants)=>setMeta("variants",variants)}/>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 border-t border-dark-100 pt-5 sm:flex-row sm:items-center">
              <Button variant="outline" onClick={resetForm}>Batal</Button>
              <Button className="sm:ml-auto" onClick={handleSave} isLoading={isSaving}><Save className="mr-2 h-4 w-4"/>{editId ? "Simpan Perubahan" : "Buat Produk"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-dark-100 bg-white">
        {isLoading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-dark-400"/></div> :
        filteredProducts.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left"><th className="px-5 py-3 font-medium text-dark-500">Produk</th><th className="px-5 py-3 text-right font-medium text-dark-500">Harga</th><th className="px-5 py-3 font-medium text-dark-500">Status</th><th className="px-5 py-3 font-medium text-dark-500">Unggulan</th><th className="px-5 py-3 font-medium text-dark-500">Aksi</th></tr></thead><tbody>
          {filteredProducts.map((p)=><tr key={p.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-dark-100 bg-dark-50">{p.thumbnail ? <SiteImage src={p.thumbnail} alt={p.name} fill sizes="64px" className="object-cover"/>:<MediaPlaceholder label="No image" className="h-full w-full"/>}</div><div className="min-w-0"><p className="truncate font-medium text-dark">{p.name}</p><p className="truncate text-xs text-dark-400">/{p.slug}</p></div></div></td><td className="px-5 py-3.5 text-right font-semibold text-dark">{formatCurrency(Number(p.basePrice))}<span className="font-normal text-dark-400">/{p.unit||"pcs"}</span></td><td className="px-5 py-3.5"><button onClick={()=>void handleToggle(p.id,"isActive",p.isActive)}><Badge variant={p.isActive?"success":"error"}>{p.isActive?"Aktif":"Nonaktif"}</Badge></button></td><td className="px-5 py-3.5"><button onClick={()=>void handleToggle(p.id,"isFeatured",!!p.isFeatured)} aria-label={p.isFeatured?"Matikan featured":"Jadikan featured"}>{p.isFeatured?<Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>:<Star className="h-4 w-4 text-dark-300" />}</button></td><td className="px-5 py-3.5"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={()=>void startEdit(p.id)} aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={()=>setDeleteTarget({id:p.id,name:p.name})} aria-label={`Nonaktifkan ${p.name}`}><Trash2 className="h-4 w-4 text-red-500"/></Button></div></td></tr>)}
        </tbody></table></div> : <div className="flex flex-col items-center justify-center py-16"><Package className="h-10 w-10 text-dark-300"/><p className="mt-4 font-semibold text-dark">Belum ada produk</p><p className="mt-1 text-sm text-dark-500">Tambahkan produk pertama untuk toko Anda.</p></div>}
      </div>

      <ConfirmDialog open={!!deleteTarget} title={`Nonaktifkan "${deleteTarget?.name}"?`} description="Produk tidak dihapus dari database; status aktif dimatikan agar histori pesanan tetap aman." confirmLabel="Nonaktifkan" variant="danger" isLoading={isDeleting} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,255);
}
function Field({label,help,className,children}:{label:string;help?:string;className?:string;children:React.ReactNode}) {
  return <div className={className}><label className="mb-1.5 block text-sm font-medium text-dark">{label}</label>{children}{help&&<p className="mt-1 text-xs text-dark-500">{help}</p>}</div>;
}
function Counter({value,max}:{value:string;max:number}) { return <p className={`mt-1 text-right text-[11px] ${value.length>max?"text-red-600":"text-dark-400"}`}>{value.length}/{max}</p>; }

function VariantBuilder({value,onChange}:{value:ProductAdminMetadata["variants"];onChange:(v:NonNullable<ProductAdminMetadata["variants"]>)=>void}) {
  const enabled=!!value?.enabled; const attrs=value?.attributes||[];
  const addAttr=()=>onChange({enabled:true,attributes:[...attrs,{name:"",values:[{label:"",value:""}]}]});
  return <div className="space-y-5"><div className="flex items-center justify-between rounded-2xl border border-dark-200 p-4"><div><h3 className="font-semibold text-dark">Variant matrix</h3><p className="text-xs text-dark-500">Model atribut seperti ukuran, bahan, finishing, warna, kapasitas. Setiap nilai dapat memiliki modifier harga, SKU, stok, dan gambar.</p></div><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={enabled} onChange={(e)=>onChange({enabled:e.target.checked,attributes:attrs})}/>Aktif</label></div>
    {attrs.map((attr,ai)=><Card key={ai}><CardContent className="p-5"><div className="flex gap-2"><Input value={attr.name} onChange={(e)=>{const a=attrs.map((x,i)=>i===ai?{...x,name:e.target.value}:x);onChange({enabled:true,attributes:a})}} placeholder="Contoh: Ukuran"/><Button type="button" variant="ghost" size="icon" onClick={()=>onChange({enabled,attributes:attrs.filter((_,i)=>i!==ai)})} aria-label="Hapus atribut"><Trash2 className="h-4 w-4 text-red-500"/></Button></div><div className="mt-3 space-y-3">{attr.values.map((v,vi)=><div key={vi} className="rounded-xl border border-dark-100 bg-dark-50/50 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_120px_40px]"><Input value={v.label} placeholder="Label" onChange={(e)=>updateVariantValue(onChange,attrs,ai,vi,{label:e.target.value})}/><Input value={v.value} placeholder="Value" onChange={(e)=>updateVariantValue(onChange,attrs,ai,vi,{value:e.target.value})}/><Input type="number" value={v.priceModifier??0} placeholder="Modifier" onChange={(e)=>updateVariantValue(onChange,attrs,ai,vi,{priceModifier:Number(e.target.value)||0})}/><Input value={v.sku||""} placeholder="SKU" onChange={(e)=>updateVariantValue(onChange,attrs,ai,vi,{sku:e.target.value})}/><Button type="button" variant="ghost" size="icon" onClick={()=>{const a=attrs.map((x,i)=>i===ai?{...x,values:x.values.filter((_,j)=>j!==vi)}:x);onChange({enabled,attributes:a})}} aria-label="Hapus nilai"><X className="h-4 w-4"/></Button></div><div className="mt-3 max-w-xl"><MediaUploader value={v.image || ""} onChange={(uploaded)=>updateVariantValue(onChange,attrs,ai,vi,{image:Array.isArray(uploaded)?uploaded[0]||"":uploaded})} purpose="product_image" label={`Gambar ${v.label || v.value || `varian ${vi + 1}`}`} helpText="Gambar ini otomatis ikut tampil di galeri produk." /></div></div>)}</div><Button className="mt-3" type="button" size="sm" variant="outline" onClick={()=>{const a=attrs.map((x,i)=>i===ai?{...x,values:[...x.values,{label:"",value:""}]}:x);onChange({enabled:true,attributes:a})}}><Plus className="mr-1 h-4 w-4"/>Tambah nilai</Button></CardContent></Card>)}
    <Button type="button" variant="outline" onClick={addAttr}><Plus className="mr-2 h-4 w-4"/>Tambah atribut varian</Button>
    <p className="rounded-xl bg-dark-50 p-4 text-xs text-dark-500">Catatan: kombinasi SKU/stok matrix dapat dikembangkan ke inventory ledger terpisah tanpa mengubah editor ini.</p>
  </div>;
}
function updateVariantValue(onChange:(v:NonNullable<ProductAdminMetadata["variants"]>)=>void,attrs:VariantAttribute[],ai:number,vi:number,patch:Partial<VariantAttribute["values"][number]>) {
  const next=attrs.map((x,i)=>i===ai?{...x,values:x.values.map((v,j)=>j===vi?{...v,...patch}:v)}:x);
  onChange({enabled:true,attributes:next});
}

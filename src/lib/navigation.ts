export type NavigationItem = {
  name: string;
  href: string;
};

export type NavigationGroup = {
  category: string;
  slug: string;
  description: string;
  color: string;
  icon: "design" | "printing" | "advertising" | "branding" | "business";
  items: NavigationItem[];
};

/**
 * Public navigation contract.
 *
 * IMPORTANT: every href in this file is intentionally limited to routes that
 * exist in the application or to product/service URLs backed by seeded data.
 * Keep this file as the single source of truth for desktop/mobile marketing
 * navigation. Do not invent category routes here unless the corresponding
 * route and data model are implemented.
 *
 * Two layers live here on purpose:
 *  - QUICK_NAV_* — the compact, non-overlapping taxonomy used by the header
 *    Mega Menu and the Mobile Nav. Each destination appears in exactly ONE
 *    of these three lists so desktop and mobile never show duplicated or
 *    mismatched entries.
 *  - SERVICE_NAV_GROUPS / PRODUCT_NAV_GROUP / COMPANY_NAV_GROUPS — the
 *    richer "browse by need" groupings used on the full /services page and
 *    the footer, where mixing a service with related product categories is
 *    intentional (e.g. "need Digital Printing? see banners & stickers").
 */

// ---------------------------------------------------------------------------
// Quick nav (Mega Menu + Mobile Nav) — single shared source, no duplicates.
// ---------------------------------------------------------------------------

export type QuickNavIcon =
  | "logo-design"
  | "brand-identity"
  | "social-media"
  | "packaging"
  | "banner"
  | "sticker"
  | "business-card"
  | "brochure"
  | "invitation"
  | "poster"
  | "calendar"
  | "signage"
  | "portfolio"
  | "blog"
  | "faq"
  | "about"
  | "contact"
  | "sparkles"
  | "star"
  | "award"
  | "zap"
  | "gift"
  | "shield-check"
  | "trending-up"
  | "users"
  | "clock"
  | "map-pin"
  | "truck"
  | "percent";

export const QUICK_NAV_ICON_KEYS: QuickNavIcon[] = [
  "logo-design",
  "brand-identity",
  "social-media",
  "packaging",
  "banner",
  "sticker",
  "business-card",
  "brochure",
  "invitation",
  "poster",
  "calendar",
  "signage",
  "portfolio",
  "blog",
  "faq",
  "about",
  "contact",
  "sparkles",
  "star",
  "award",
  "zap",
  "gift",
  "shield-check",
  "trending-up",
  "users",
  "clock",
  "map-pin",
  "truck",
  "percent",
];

export type QuickNavItem = {
  name: string;
  href: string;
  icon: QuickNavIcon;
  description?: string;
};

export const QUICK_NAV_SERVICES: QuickNavItem[] = [
  { name: "Logo Design", href: "/services/logo-design", icon: "logo-design", description: "Identitas visual awal brand Anda" },
  { name: "Brand Identity", href: "/services/brand-identity", icon: "brand-identity", description: "Panduan visual brand menyeluruh" },
  { name: "Social Media Design", href: "/services/social-media-design", icon: "social-media", description: "Konten visual media sosial" },
  { name: "Packaging Design", href: "/services/packaging-design", icon: "packaging", description: "Desain kemasan produk" },
];

export const QUICK_NAV_PRODUCTS: QuickNavItem[] = [
  { name: "Banner & Spanduk", href: "/products?category=banner", icon: "banner" },
  { name: "Sticker", href: "/products?category=sticker", icon: "sticker" },
  { name: "Kartu Nama", href: "/products?category=kartu-nama", icon: "business-card" },
  { name: "Brosur", href: "/products?category=brosur", icon: "brochure" },
  { name: "Undangan", href: "/products?category=undangan", icon: "invitation" },
  { name: "Poster", href: "/products?category=poster", icon: "poster" },
  { name: "Kalender", href: "/products?category=kalender", icon: "calendar" },
  { name: "Signage", href: "/products?category=signage", icon: "signage" },
];

export const QUICK_NAV_EXPLORE: QuickNavItem[] = [
  { name: "Portfolio", href: "/portfolio", icon: "portfolio", description: "Hasil karya & studi kasus kami" },
  { name: "Artikel & Insight", href: "/blog", icon: "blog", description: "Tips seputar branding & percetakan" },
  { name: "FAQ", href: "/faq", icon: "faq", description: "Pertanyaan yang sering diajukan" },
  { name: "Tentang Kami", href: "/about", icon: "about", description: "Kenali Madina Solution" },
  { name: "Kontak", href: "/contact", icon: "contact", description: "Hubungi tim kami" },
];

// ---------------------------------------------------------------------------
// Full /services page + footer groupings ("browse by need").
// ---------------------------------------------------------------------------

export const SERVICE_NAV_GROUPS: NavigationGroup[] = [
  {
    category: "Design",
    slug: "design",
    description: "Identitas visual profesional",
    color: "from-blue-500 to-blue-600",
    icon: "design",
    items: [
      { name: "Logo Design", href: "/services/logo-design" },
      { name: "Brand Identity", href: "/services/brand-identity" },
      { name: "Social Media Design", href: "/services/social-media-design" },
      { name: "Packaging Design", href: "/services/packaging-design" },
    ],
  },
  {
    category: "Digital Printing",
    slug: "printing",
    description: "Cetak berkualitas premium",
    color: "from-green-500 to-green-600",
    icon: "printing",
    items: [
      { name: "Banner", href: "/products?category=banner" },
      { name: "Sticker", href: "/products?category=sticker" },
      { name: "Kartu Nama", href: "/products?category=kartu-nama" },
      { name: "Brosur", href: "/products?category=brosur" },
      { name: "Undangan", href: "/products?category=undangan" },
      { name: "Poster", href: "/products?category=poster" },
    ],
  },
  {
    category: "Advertising",
    slug: "advertising",
    description: "Media promosi indoor & outdoor",
    color: "from-purple-500 to-purple-600",
    icon: "advertising",
    items: [
      { name: "Neon Box", href: "/products?category=signage&q=neon" },
      { name: "Signage", href: "/products?category=signage" },
      { name: "X-Banner", href: "/products?q=x-banner" },
      { name: "Spanduk", href: "/products?q=spanduk" },
    ],
  },
  {
    category: "Paket Bisnis",
    slug: "business",
    description: "Solusi konsultasi untuk UMKM & corporate",
    color: "from-pink-500 to-pink-600",
    icon: "business",
    items: [
      { name: "Konsultasi Paket UMKM", href: "/contact" },
      { name: "Konsultasi Corporate", href: "/contact" },
      { name: "Konsultasi Event", href: "/contact" },
    ],
  },
];
// NOTE: the former standalone "Branding" group was removed here — it only
// re-listed Brand Identity / Packaging Design / Social Media Design, which
// already live under "Design" above. Keeping both was pure duplication.

export const ALL_PUBLIC_NAV_HREFS = [
  "/",
  "/services",
  "/products",
  "/portfolio",
  "/about",
  "/contact",
  "/blog",
  "/faq",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/account",
] as const;

export const PRODUCT_NAV_GROUP = {
  category: "Produk",
  slug: "products",
  description: "Produk cetak dan advertising siap dipesan",
  items: [
    { name: "Banner & Spanduk", href: "/products?category=banner" },
    { name: "Sticker", href: "/products?category=sticker" },
    { name: "Kartu Nama", href: "/products?category=kartu-nama" },
    { name: "Brosur", href: "/products?category=brosur" },
    { name: "Undangan", href: "/products?category=undangan" },
    { name: "Poster", href: "/products?category=poster" },
    { name: "Kalender", href: "/products?category=kalender" },
    { name: "Signage", href: "/products?category=signage" },
  ],
} as const;

export const COMPANY_NAV_GROUPS = [
  {
    category: "Portfolio",
    slug: "portfolio",
    description: "Lihat hasil pekerjaan dan studi visual kami",
    items: [
      { name: "Semua Portfolio", href: "/portfolio" },
      { name: "Artikel & Insight", href: "/blog" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  {
    category: "Perusahaan",
    slug: "company",
    description: "Kenali Madina Solution lebih dekat",
    items: [
      { name: "Tentang Kami", href: "/about" },
      { name: "Kontak", href: "/contact" },
      { name: "Mulai Pesanan", href: "/contact" },
    ],
  },
] as const;

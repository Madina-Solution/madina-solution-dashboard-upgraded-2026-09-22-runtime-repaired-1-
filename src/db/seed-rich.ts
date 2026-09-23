import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { db } from "./index";
import { categories, products, services, testimonials, portfolio, articles, settings } from "./schema";
import { eq, sql } from "drizzle-orm";

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1200&q=85",
];

const CATEGORY_DEFS = [
  { name: "Banner", slug: "banner", description: "Banner dan spanduk untuk kebutuhan promosi indoor maupun outdoor." },
  { name: "Sticker", slug: "sticker", description: "Sticker vinyl, chromo, cutting, label, dan kebutuhan branding produk." },
  { name: "Kartu Nama", slug: "kartu-nama", description: "Kartu nama profesional dengan pilihan kertas dan finishing." },
  { name: "Brosur", slug: "brosur", description: "Brosur, flyer, leaflet, dan materi promosi cetak." },
  { name: "Undangan", slug: "undangan", description: "Undangan pernikahan, acara keluarga, dan event." },
  { name: "Poster", slug: "poster", description: "Poster promosi, event, edukasi, dan dekorasi." },
  { name: "Kalender", slug: "kalender", description: "Kalender custom untuk promosi dan souvenir bisnis." },
  { name: "Signage", slug: "signage", description: "Neon box, papan nama, akrilik, wayfinding, dan signage bisnis." },
] as const;

const PRODUCT_TYPES: Record<string, string[]> = {
  banner: ["Flexi Korea", "Flexi Premium", "Spanduk Outdoor", "Backdrop Event", "X-Banner", "Roll Up Banner", "Y-Banner", "Mini Banner", "Umbul-Umbul", "Photobooth Backdrop"],
  sticker: ["Vinyl Glossy", "Vinyl Matte", "Chromo", "Transparan", "Cutting", "Hologram", "Label Produk", "Wall Sticker", "Car Sticker", "Floor Sticker"],
  "kartu-nama": ["Art Carton 310gsm", "Art Carton 400gsm", "Linen", "BW", "Ivory Premium", "Kraft Minimalis", "Soft Touch", "Spot UV", "Emboss", "Die Cut"],
  brosur: ["A5 1 Sisi", "A5 2 Sisi", "A4 1 Sisi", "A4 2 Sisi", "Tri Fold", "Bi Fold", "DL", "Flyer Premium", "Leaflet", "Company Profile Sheet"],
  undangan: ["Minimalis", "Elegant", "Floral", "Jasmine", "Linen", "Hard Cover", "Gatefold", "Acrylic", "Luxury Foil", "Digital Wedding"],
  poster: ["A4", "A3", "A2", "A1", "A0", "Matte", "Glossy", "Event Poster", "Promotional Poster", "Campaign Poster"],
  kalender: ["Dinding 12 Lembar", "Dinding 6 Lembar", "Meja Spiral", "Meja Standing", "Desk Calendar", "Poster Calendar", "Magnet Calendar", "Corporate Calendar", "Custom Photo Calendar", "Souvenir Calendar"],
  signage: ["Neon Box", "Akrilik Sign", "Papan Nama", "Huruf Timbul", "LED Sign", "Directional Sign", "Office Sign", "Acrylic Directory", "Kios Signage", "Custom Sign System"],
};

const SERVICE_DEFS = [
  ["Logo Design", "logo-design", "Desain logo profesional untuk identitas bisnis.", "500000", 7],
  ["Brand Identity", "brand-identity", "Paket identitas visual lengkap untuk bisnis.", "2500000", 14],
  ["Social Media Design", "social-media-design", "Desain konten social media yang konsisten.", "75000", 2],
  ["Packaging Design", "packaging-design", "Desain kemasan yang menarik dan siap produksi.", "750000", 7],
  ["Company Profile", "company-profile", "Desain company profile untuk presentasi bisnis.", "1250000", 10],
  ["Menu & Price List", "menu-price-list", "Desain menu dan daftar harga yang mudah dibaca.", "250000", 3],
  ["Brochure Design", "brochure-design", "Desain brosur promosi dua sisi atau lipat.", "300000", 3],
  ["Poster & Flyer Design", "poster-flyer-design", "Materi promosi event dan campaign.", "175000", 2],
  ["Banner & Signage Design", "banner-signage-design", "Desain banner, neon box, dan signage.", "200000", 2],
  ["Event Branding", "event-branding", "Sistem visual untuk event dan activations.", "1500000", 10],
  ["Print Consultation", "print-consultation", "Konsultasi bahan, ukuran, finishing, dan produksi.", "0", 1],
  ["Digital Printing", "digital-printing", "Layanan produksi cetak digital berbagai format.", "25000", 2],
  ["Large Format Printing", "large-format-printing", "Cetak ukuran besar untuk promosi dan event.", "18000", 2],
  ["Corporate Branding", "corporate-branding", "Paket visual untuk kebutuhan corporate.", "3500000", 21],
  ["UMKM Starter Branding", "umkm-starter-branding", "Paket branding praktis untuk UMKM.", "1750000", 14],
  ["Content Design Subscription", "content-design-subscription", "Desain konten bulanan untuk kebutuhan rutin.", "1200000", 30],
] as const;

const TESTIMONIAL_NAMES = [
  ["Ari Nugraha", "Owner", "Kopi Lereng"], ["Siti Aminah", "Owner", "Batik Arunika"], ["Rizky Pratama", "Marketing", "CV Maju Bersama"],
  ["Dewi Lestari", "Event Organizer", "Dewi Events"], ["Hendra Wijaya", "Owner", "Batik Kedu"], ["Novi Rahma", "Owner", "Snack Nona"],
  ["Fajar Santoso", "Manager", "Klinik Sehat"], ["Mila Kartika", "Founder", "Mila Florist"], ["Andi Setiawan", "Owner", "Bengkel Jaya"],
  ["Lina Wati", "Owner", "Lina Fashion"], ["Bagus Saputra", "Marketing", "Temanggung Expo"], ["Rani Maharani", "Owner", "Rani Cake"],
  ["Teguh Purnomo", "Owner", "Lesehan Kedu"], ["Yuni Astuti", "Teacher", "Lembaga Cerdas"], ["Galih Prakoso", "Founder", "Kedu Creative"],
  ["Dimas Wahyu", "Owner", "Kopi Tengah"], ["Nisa Kurnia", "Owner", "Nisa Wedding"], ["Bowo Hartanto", "Director", "PT Nusantara Prima"],
  ["Vina Sari", "Owner", "Vina Hijab"], ["Robby Hadi", "Manager", "Toko Elektronik Jaya"], ["Anita Putri", "Owner", "Anita Decor"],
  ["Yoga Prasetyo", "Marketing", "Desa Wisata Kedu"], ["Rina Melati", "Founder", "Rumah Bunga"], ["Wahyu Kurniawan", "Owner", "Wahyu Auto"],
] as const;

function money(index: number, category: string) {
  const bases: Record<string, number> = { banner: 25000, sticker: 85000, "kartu-nama": 75000, brosur: 1500, undangan: 3500, poster: 12000, kalender: 8500, signage: 350000 };
  return String((bases[category] || 50000) + (index * Math.max(5000, Math.round((bases[category] || 50000) * 0.08))));
}

async function seedRich() {
  console.log("🌱 Rich seed: content, catalog, homepage settings...");
  const mapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.3671256912222!2d110.1555280331352!3d-7.2551769777527015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70795cfc6cf129%3A0xa0254c4ef1fe6d5f!2sJoglo%20Market!5e0!3m2!1sid!2sid!4v1788080189081!5m2!1sid!2sid";


  for (const category of CATEGORY_DEFS) {
    await db.insert(categories).values({ ...category, order: CATEGORY_DEFS.findIndex((item) => item.slug === category.slug) + 1 }).onConflictDoNothing({ target: categories.slug });
  }

  const categoryRows = await db.select().from(categories);
  const categoryMap = new Map(categoryRows.map((row) => [row.slug, row.id]));

  let productsCreated = 0;
  for (const category of CATEGORY_DEFS) {
    const categoryId = categoryMap.get(category.slug);
    if (!categoryId) continue;
    const countRow = await db.select({ count: sql<number>`count(*)::int` }).from(products).where(eq(products.categoryId, categoryId));
    const existing = countRow[0]?.count ?? 0;
    const needed = Math.max(0, 10 - existing);
    const types = PRODUCT_TYPES[category.slug] || [];
    for (let i = 0; i < needed; i++) {
      const globalIndex = existing + i + 1;
      const name = types[globalIndex - 1] || `${category.name} Custom ${globalIndex}`;
      const slug = `${category.slug}-${String(globalIndex).padStart(2, "0")}`;
      const image = IMAGE_POOL[(globalIndex + category.slug.length) % IMAGE_POOL.length];
      const gallery = [image, IMAGE_POOL[(globalIndex + 1) % IMAGE_POOL.length], IMAGE_POOL[(globalIndex + 2) % IMAGE_POOL.length]];
      await db.insert(products).values({
        categoryId, name, slug,
        shortDescription: `${name} untuk kebutuhan ${category.name.toLowerCase()} profesional.`,
        description: `${name} diproduksi dengan pilihan material dan finishing yang dapat disesuaikan dengan kebutuhan bisnis, event, dan promosi.`,
        thumbnail: image, gallery, basePrice: money(globalIndex, category.slug), unit: category.slug === "brosur" || category.slug === "poster" ? "lembar" : category.slug === "kartu-nama" ? "box" : "pcs",
        minOrder: category.slug === "brosur" ? 100 : category.slug === "undangan" ? 50 : 1,
        productionDays: category.slug === "signage" ? 7 : category.slug === "kalender" ? 5 : 2,
        isFeatured: globalIndex <= 3,
        rating: String((4.5 + ((globalIndex % 5) * 0.1)).toFixed(1)), reviewCount: 5 + globalIndex * 3,
        specifications: { material: category.name, finish: globalIndex % 2 ? "Premium" : "Standard", quality: "High Resolution" },
      }).onConflictDoNothing({ target: products.slug });
      productsCreated++;
    }
  }

  let servicesCreated = 0;
  for (const [index, [name, slug, shortDescription, price, days]] of SERVICE_DEFS.entries()) {
    const image = IMAGE_POOL[(index + 3) % IMAGE_POOL.length];
    await db.insert(services).values({
      name, slug, shortDescription, description: `${shortDescription} Layanan dikelola melalui workflow Madina Solution dari konsultasi, produksi, hingga delivery.`,
      thumbnail: image, gallery: [image, IMAGE_POOL[(index + 4) % IMAGE_POOL.length]], startingPrice: price,
      features: ["Konsultasi", "Brief & review", "File final", "Dukungan setelah delivery"],
      deliverables: ["File final siap pakai", "Preview persetujuan", "Panduan penggunaan"],
      estimatedDays: days, isFeatured: index < 8,
    }).onConflictDoNothing({ target: services.slug });
    servicesCreated++;
  }

  let testimonialsCreated = 0;
  for (const [index, [name, role, company]] of TESTIMONIAL_NAMES.entries()) {
    const image = IMAGE_POOL[(index + 5) % IMAGE_POOL.length];
    const rating = index % 7 === 0 ? 4 : 5;
    await db.insert(testimonials).values({
      name, role, company,
      avatar: image,
      content: `${name} memilih Madina Solution untuk kebutuhan visual ${company}. Prosesnya jelas, hasilnya rapi, dan komunikasi selama pengerjaan terasa mudah.`,
      rating, isFeatured: index < 8,
    }).onConflictDoNothing();
    testimonialsCreated++;
  }

  const portfolioItems = Array.from({ length: 12 }, (_, index) => {
    const image = IMAGE_POOL[index % IMAGE_POOL.length];
    return {
      title: `Project Showcase ${index + 1}`,
      slug: `project-showcase-${index + 1}`,
      description: `Studi kasus desain dan produksi Madina Solution untuk kebutuhan bisnis, event, atau branding ${index + 1}.`,
      category: ["Branding", "Printing", "Advertising", "Design"][index % 4],
      client: TESTIMONIAL_NAMES[index][2],
      thumbnail: image,
      images: [image, IMAGE_POOL[(index + 1) % IMAGE_POOL.length], IMAGE_POOL[(index + 2) % IMAGE_POOL.length]],
      tags: ["Design", "Print", "Business"], isFeatured: index < 6,
    };
  });
  for (const item of portfolioItems) await db.insert(portfolio).values(item).onConflictDoNothing({ target: portfolio.slug });

  const articleItems = Array.from({ length: 8 }, (_, index) => {
    const image = IMAGE_POOL[(index + 2) % IMAGE_POOL.length];
    return {
      title: ["Cara Memilih Material Cetak", "Panduan Branding UMKM", "Checklist File Siap Cetak", "Strategi Konten Visual", "Memilih Finishing Premium", "Membuat Signage Efektif", "Tips Kemasan Produk", "Persiapan Event Branding"][index],
      slug: `panduan-madina-${index + 1}`,
      excerpt: "Insight praktis dari Madina Solution untuk membantu bisnis membuat keputusan visual dan produksi yang lebih tepat.",
      content: "Artikel panduan Madina Solution. Konsultasikan kebutuhan spesifik Anda kepada tim kami untuk rekomendasi bahan, ukuran, desain, dan workflow yang sesuai.",
      category: ["Design", "Printing", "Branding", "Marketing"][index % 4], thumbnail: image, isPublished: true, publishedAt: new Date(),
    };
  });
  for (const item of articleItems) await db.insert(articles).values(item).onConflictDoNothing({ target: articles.slug });

  // Backfill media for existing records created by older seeds so the current UI
  // does not fall back to empty placeholders when rich seed is run on an existing DB.
  const existingCategories = await db.select().from(categories);
  for (const [index, category] of existingCategories.entries()) {
    if (!category.image) {
      await db.update(categories).set({ image: IMAGE_POOL[index % IMAGE_POOL.length], updatedAt: new Date() }).where(eq(categories.id, category.id));
    }
  }

  const existingProducts = await db.select().from(products);
  for (const [index, product] of existingProducts.entries()) {
    const image = product.thumbnail || IMAGE_POOL[index % IMAGE_POOL.length];
    const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : [image, IMAGE_POOL[(index + 1) % IMAGE_POOL.length], IMAGE_POOL[(index + 2) % IMAGE_POOL.length]];
    if (!product.thumbnail || !Array.isArray(product.gallery) || product.gallery.length === 0) {
      await db.update(products).set({ thumbnail: image, gallery, updatedAt: new Date() }).where(eq(products.id, product.id));
    }
  }

  const existingServices = await db.select().from(services);
  for (const [index, service] of existingServices.entries()) {
    const image = service.thumbnail || IMAGE_POOL[(index + 3) % IMAGE_POOL.length];
    const gallery = Array.isArray(service.gallery) && service.gallery.length > 0
      ? service.gallery
      : [image, IMAGE_POOL[(index + 4) % IMAGE_POOL.length]];
    if (!service.thumbnail || !Array.isArray(service.gallery) || service.gallery.length === 0) {
      await db.update(services).set({ thumbnail: image, gallery, updatedAt: new Date() }).where(eq(services.id, service.id));
    }
  }

  const existingTestimonials = await db.select().from(testimonials);
  for (const [index, testimonial] of existingTestimonials.entries()) {
    if (!testimonial.avatar) {
      await db.update(testimonials).set({ avatar: IMAGE_POOL[(index + 5) % IMAGE_POOL.length] }).where(eq(testimonials.id, testimonial.id));
    }
  }

  const existingPortfolio = await db.select().from(portfolio);
  for (const [index, item] of existingPortfolio.entries()) {
    const image = item.thumbnail || IMAGE_POOL[index % IMAGE_POOL.length];
    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : [image, IMAGE_POOL[(index + 1) % IMAGE_POOL.length], IMAGE_POOL[(index + 2) % IMAGE_POOL.length]];
    if (!item.thumbnail || !Array.isArray(item.images) || item.images.length === 0) {
      await db.update(portfolio).set({ thumbnail: image, images, updatedAt: new Date() }).where(eq(portfolio.id, item.id));
    }
  }

  const existingArticles = await db.select().from(articles);
  for (const [index, article] of existingArticles.entries()) {
    if (!article.thumbnail) {
      await db.update(articles).set({ thumbnail: IMAGE_POOL[(index + 2) % IMAGE_POOL.length], updatedAt: new Date() }).where(eq(articles.id, article.id));
    }
  }

  const homepageSettings = [
    ["site_name", "Madina Solution"],
    ["site_tagline", "Creative Business Platform"],
    ["site_email", "Perc.madina@gmail.com"],
    ["site_phone", "+62 813-9300-5035"],
    ["site_whatsapp", "6281393005035"],
    ["site_address", "Dusun Ngleri, Desa Ngadimulyo, Kecamatan Kedu, Kabupaten Temanggung, Jawa Tengah, Indonesia"],
    ["site_url", "https://madinasolution.vercel.app"],
    ["maps_embed_url", "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d247.3671256912222!2d110.1555280331352!3d-7.2551769777527015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70795cfc6cf129%3A0xa0254c4ef1fe6d5f!2sJoglo%20Market!5e0!3m2!1sid!2sid!4v1788080189081!5m2!1sid!2sid"],
    ["topbar_enabled", true],
    ["topbar_text", "Creative Business Platform untuk kebutuhan bisnis Anda"],
    ["adsense_enabled", false],
    ["adsense_client", ""],
    ["adsense_publisher_id", ""],
    ["adsense_slot_top", ""],
    ["adsense_slot_footer", ""],
    ["adsense_slot_product", ""],
    ["adsense_slot_article", ""],
    ["hero_badge", "Creative Business Platform"],
    ["hero_title", "Bangun Citra Bisnis yang Lebih Profesional"],
    ["hero_description", "Dari desain hingga produksi, Madina Solution membantu bisnis menghadirkan identitas visual yang kuat, konsisten, dan siap tampil di dunia nyata."],
    ["hero_image", IMAGE_POOL[0]],
    ["hero_image_alt", "Tim kreatif mengerjakan desain visual untuk kebutuhan bisnis"],
    ["cta_title", "Siap Membuat Bisnis Anda Tampil Lebih Profesional?"],
    ["cta_description", "Konsultasikan kebutuhan desain, cetak, branding, dan advertising Anda dengan tim Madina Solution."],
    ["business_since", "2016"],
    ["business_response_hours", 24],
  ] as const;
  for (const [key, value] of homepageSettings) await db.insert(settings).values({ key, value: { value } }).onConflictDoNothing({ target: settings.key });

  console.log(`✅ Rich seed complete: +${productsCreated} products, +${servicesCreated} services, +${testimonialsCreated} testimonials, 12 portfolio, 8 articles.`);
}

seedRich().catch((error) => { console.error("❌ Rich seed failed:", error); process.exit(1); });

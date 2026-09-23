import { db } from "./index";
import { products } from "./schema";
import { eq } from "drizzle-orm";
import type { ProductOption } from "./schema";

// Product options configurations
const PRODUCT_OPTIONS: Record<string, ProductOption[]> = {
  // Banner Flexi Korea
  "banner-flexi-korea": [
    {
      id: "size",
      name: "Ukuran",
      key: "size",
      type: "select",
      required: true,
      helpText: "Pilih ukuran banner atau pilih custom",
      values: [
        { label: "1 × 1 m", value: "1x1", priceModifier: 0 },
        { label: "1 × 2 m", value: "1x2", priceModifier: 25000 },
        { label: "2 × 1 m", value: "2x1", priceModifier: 25000 },
        { label: "2 × 3 m", value: "2x3", priceModifier: 125000 },
        { label: "3 × 2 m", value: "3x2", priceModifier: 125000 },
        { label: "Custom", value: "custom", priceModifier: 0, description: "Hubungi kami untuk ukuran custom" },
      ],
      displayOrder: 1,
    },
    {
      id: "material",
      name: "Material",
      key: "material",
      type: "select",
      required: true,
      values: [
        { label: "Flexi Korea 280gsm", value: "flexi-korea-280", priceModifier: 0 },
        { label: "Flexi China 280gsm", value: "flexi-china-280", priceModifier: -5000 },
        { label: "Flexi Korea 340gsm (Premium)", value: "flexi-korea-340", priceModifier: 10000 },
      ],
      displayOrder: 2,
    },
    {
      id: "finishing",
      name: "Finishing",
      key: "finishing",
      type: "select",
      required: true,
      values: [
        { label: "Tanpa Finishing", value: "none", priceModifier: 0 },
        { label: "Mata Ayam (per 4 sudut)", value: "mata-ayam", priceModifier: 8000 },
        { label: "Selongsong Atas Bawah", value: "selongsong", priceModifier: 15000 },
        { label: "Mata Ayam + Selongsong", value: "kombinasi", priceModifier: 20000 },
      ],
      displayOrder: 3,
    },
    {
      id: "design_status",
      name: "Status Desain",
      key: "design_status",
      type: "radio",
      required: true,
      values: [
        { label: "Sudah ada desain (upload file)", value: "upload", priceModifier: 0 },
        { label: "Butuh jasa desain (+Rp 50.000)", value: "need_design", priceModifier: 50000 },
      ],
      displayOrder: 4,
    },
  ],

  // X-Banner Complete
  "x-banner-complete": [
    {
      id: "size",
      name: "Ukuran",
      key: "size",
      type: "select",
      required: true,
      values: [
        { label: "60 × 160 cm (Standar)", value: "60x160", priceModifier: 0 },
        { label: "80 × 180 cm (Large)", value: "80x180", priceModifier: 35000 },
      ],
      displayOrder: 1,
    },
    {
      id: "standing",
      name: "Tipe Standing",
      key: "standing",
      type: "select",
      required: true,
      values: [
        { label: "Standing Aluminium", value: "aluminium", priceModifier: 0 },
        { label: "Standing Stainless", value: "stainless", priceModifier: 25000 },
      ],
      displayOrder: 2,
    },
    {
      id: "design_status",
      name: "Status Desain",
      key: "design_status",
      type: "radio",
      required: true,
      values: [
        { label: "Sudah ada desain", value: "upload", priceModifier: 0 },
        { label: "Butuh jasa desain", value: "need_design", priceModifier: 50000 },
      ],
      displayOrder: 3,
    },
  ],

  // Sticker Vinyl Glossy
  "sticker-vinyl-glossy": [
    {
      id: "size",
      name: "Ukuran",
      key: "size",
      type: "select",
      required: true,
      helpText: "Harga per meter persegi",
      values: [
        { label: "A3 (30×42 cm)", value: "a3", priceModifier: -130000 },
        { label: "A2 (42×59 cm)", value: "a2", priceModifier: -110000 },
        { label: "A1 (59×84 cm)", value: "a1", priceModifier: -80000 },
        { label: "50 × 50 cm", value: "50x50", priceModifier: -112000 },
        { label: "1 × 1 m", value: "1x1", priceModifier: 0 },
        { label: "Custom (per m²)", value: "custom", priceModifier: 0 },
      ],
      displayOrder: 1,
    },
    {
      id: "cutting",
      name: "Tipe Cutting",
      key: "cutting",
      type: "select",
      required: true,
      values: [
        { label: "Tanpa Cutting (lembaran)", value: "none", priceModifier: 0 },
        { label: "Cutting Kotak", value: "square", priceModifier: 10000 },
        { label: "Cutting Bentuk (die cut)", value: "diecut", priceModifier: 25000 },
      ],
      displayOrder: 2,
    },
    {
      id: "lamination",
      name: "Laminasi",
      key: "lamination",
      type: "select",
      required: false,
      values: [
        { label: "Tanpa Laminasi", value: "none", priceModifier: 0 },
        { label: "Laminasi Glossy", value: "glossy", priceModifier: 15000 },
        { label: "Laminasi Doff", value: "doff", priceModifier: 15000 },
      ],
      displayOrder: 3,
    },
  ],

  // Kartu Nama Premium
  "kartu-nama-premium": [
    {
      id: "paper",
      name: "Jenis Kertas",
      key: "paper",
      type: "select",
      required: true,
      values: [
        { label: "Art Carton 310gsm", value: "artcarton-310", priceModifier: 0 },
        { label: "Art Carton 400gsm", value: "artcarton-400", priceModifier: 15000 },
        { label: "Linen 250gsm", value: "linen-250", priceModifier: 25000 },
        { label: "BW 250gsm", value: "bw-250", priceModifier: 20000 },
      ],
      displayOrder: 1,
    },
    {
      id: "print_side",
      name: "Cetak",
      key: "print_side",
      type: "radio",
      required: true,
      values: [
        { label: "1 Sisi", value: "single", priceModifier: 0 },
        { label: "2 Sisi", value: "double", priceModifier: 25000 },
      ],
      displayOrder: 2,
    },
    {
      id: "finishing",
      name: "Finishing",
      key: "finishing",
      type: "select",
      required: true,
      values: [
        { label: "Tanpa Finishing", value: "none", priceModifier: 0 },
        { label: "Laminasi Glossy", value: "glossy", priceModifier: 15000 },
        { label: "Laminasi Doff", value: "doff", priceModifier: 15000 },
        { label: "Spot UV", value: "spot-uv", priceModifier: 35000 },
      ],
      displayOrder: 3,
    },
    {
      id: "quantity",
      name: "Jumlah Box",
      key: "quantity_box",
      type: "select",
      required: true,
      helpText: "1 box = 500 lembar",
      values: [
        { label: "1 Box (500 lembar)", value: "1", priceModifier: 0 },
        { label: "2 Box (1000 lembar)", value: "2", priceModifier: 50000 },
        { label: "5 Box (2500 lembar)", value: "5", priceModifier: 100000 },
      ],
      displayOrder: 4,
    },
  ],

  // Undangan Pernikahan
  "undangan-pernikahan": [
    {
      id: "paper",
      name: "Jenis Kertas",
      key: "paper",
      type: "select",
      required: true,
      values: [
        { label: "Art Carton 260gsm", value: "artcarton-260", priceModifier: 0 },
        { label: "Linen Premium", value: "linen", priceModifier: 500 },
        { label: "Jasmine", value: "jasmine", priceModifier: 750 },
        { label: "Hard Cover", value: "hardcover", priceModifier: 3500 },
      ],
      displayOrder: 1,
    },
    {
      id: "envelope",
      name: "Amplop",
      key: "envelope",
      type: "select",
      required: true,
      values: [
        { label: "Tanpa Amplop", value: "none", priceModifier: 0 },
        { label: "Amplop Standar", value: "standard", priceModifier: 500 },
        { label: "Amplop Premium", value: "premium", priceModifier: 1000 },
      ],
      displayOrder: 2,
    },
    {
      id: "guest_name",
      name: "Cetak Nama Tamu",
      key: "guest_name",
      type: "radio",
      required: true,
      values: [
        { label: "Tidak", value: "no", priceModifier: 0 },
        { label: "Ya (+Rp 200/pcs)", value: "yes", priceModifier: 200 },
      ],
      displayOrder: 3,
    },
    {
      id: "design_status",
      name: "Status Desain",
      key: "design_status",
      type: "radio",
      required: true,
      values: [
        { label: "Pilih dari template", value: "template", priceModifier: 0 },
        { label: "Upload desain sendiri", value: "upload", priceModifier: 0 },
        { label: "Custom desain (+Rp 150.000)", value: "custom", priceModifier: 150000 },
      ],
      displayOrder: 4,
    },
  ],

  // Brosur A4
  "brosur-a4": [
    {
      id: "paper",
      name: "Jenis Kertas",
      key: "paper",
      type: "select",
      required: true,
      values: [
        { label: "Art Paper 120gsm", value: "artpaper-120", priceModifier: 0 },
        { label: "Art Paper 150gsm", value: "artpaper-150", priceModifier: 200 },
        { label: "Art Carton 210gsm", value: "artcarton-210", priceModifier: 500 },
      ],
      displayOrder: 1,
    },
    {
      id: "print_side",
      name: "Cetak",
      key: "print_side",
      type: "radio",
      required: true,
      values: [
        { label: "1 Sisi", value: "single", priceModifier: 0 },
        { label: "2 Sisi (Bolak-balik)", value: "double", priceModifier: 500 },
      ],
      displayOrder: 2,
    },
    {
      id: "fold",
      name: "Lipatan",
      key: "fold",
      type: "select",
      required: false,
      values: [
        { label: "Tanpa Lipatan", value: "none", priceModifier: 0 },
        { label: "Lipat 2", value: "fold-2", priceModifier: 100 },
        { label: "Lipat 3", value: "fold-3", priceModifier: 150 },
      ],
      displayOrder: 3,
    },
  ],

  // Poster A2
  "poster-a2": [
    {
      id: "paper",
      name: "Jenis Kertas",
      key: "paper",
      type: "select",
      required: true,
      values: [
        { label: "Art Paper 150gsm", value: "artpaper-150", priceModifier: 0 },
        { label: "Art Paper 190gsm", value: "artpaper-190", priceModifier: 3000 },
        { label: "Photo Paper Glossy", value: "photo-glossy", priceModifier: 8000 },
      ],
      displayOrder: 1,
    },
    {
      id: "lamination",
      name: "Laminasi",
      key: "lamination",
      type: "select",
      required: false,
      values: [
        { label: "Tanpa Laminasi", value: "none", priceModifier: 0 },
        { label: "Laminasi Glossy", value: "glossy", priceModifier: 5000 },
        { label: "Laminasi Doff", value: "doff", priceModifier: 5000 },
      ],
      displayOrder: 2,
    },
  ],

  // Neon Box
  "neon-box": [
    {
      id: "size",
      name: "Ukuran",
      key: "size",
      type: "select",
      required: true,
      helpText: "Harga per meter persegi",
      values: [
        { label: "50 × 50 cm", value: "50x50", priceModifier: -262000 },
        { label: "50 × 100 cm", value: "50x100", priceModifier: -175000 },
        { label: "1 × 1 m", value: "1x1", priceModifier: 0 },
        { label: "1 × 2 m", value: "1x2", priceModifier: 350000 },
        { label: "Custom", value: "custom", priceModifier: 0 },
      ],
      displayOrder: 1,
    },
    {
      id: "frame",
      name: "Frame",
      key: "frame",
      type: "select",
      required: true,
      values: [
        { label: "Aluminium", value: "aluminium", priceModifier: 0 },
        { label: "Galvanis", value: "galvanis", priceModifier: -50000 },
        { label: "Stainless", value: "stainless", priceModifier: 100000 },
      ],
      displayOrder: 2,
    },
    {
      id: "face",
      name: "Face",
      key: "face",
      type: "select",
      required: true,
      values: [
        { label: "Flexi Korea", value: "flexi", priceModifier: 0 },
        { label: "Acrylic 3mm", value: "acrylic-3", priceModifier: 150000 },
        { label: "Acrylic 5mm", value: "acrylic-5", priceModifier: 250000 },
      ],
      displayOrder: 3,
    },
    {
      id: "lighting",
      name: "Lampu",
      key: "lighting",
      type: "select",
      required: true,
      values: [
        { label: "LED Strip Putih", value: "led-white", priceModifier: 0 },
        { label: "LED Strip Warm", value: "led-warm", priceModifier: 0 },
        { label: "LED Module (lebih terang)", value: "led-module", priceModifier: 75000 },
      ],
      displayOrder: 4,
    },
  ],

  // Kalender Dinding
  "kalender-dinding": [
    {
      id: "pages",
      name: "Jumlah Halaman",
      key: "pages",
      type: "select",
      required: true,
      values: [
        { label: "7 Lembar (6 bulan per lembar)", value: "7", priceModifier: -2000 },
        { label: "13 Lembar (1 bulan per lembar)", value: "13", priceModifier: 0 },
      ],
      displayOrder: 1,
    },
    {
      id: "paper",
      name: "Jenis Kertas",
      key: "paper",
      type: "select",
      required: true,
      values: [
        { label: "Art Paper 150gsm", value: "artpaper-150", priceModifier: 0 },
        { label: "Art Carton 210gsm", value: "artcarton-210", priceModifier: 1500 },
      ],
      displayOrder: 2,
    },
    {
      id: "header",
      name: "Header Perusahaan",
      key: "header",
      type: "radio",
      required: true,
      values: [
        { label: "Tanpa Header", value: "none", priceModifier: 0 },
        { label: "Dengan Header Logo/Nama", value: "with-header", priceModifier: 0 },
      ],
      displayOrder: 3,
    },
  ],
};

async function seedProductOptions() {
  console.log("🌱 Seeding product options...");

  for (const [slug, options] of Object.entries(PRODUCT_OPTIONS)) {
    const result = await db
      .update(products)
      .set({ options })
      .where(eq(products.slug, slug))
      .returning({ slug: products.slug });

    if (result.length > 0) {
      console.log(`✅ Updated options for: ${slug}`);
    } else {
      console.log(`⚠️ Product not found: ${slug}`);
    }
  }

  console.log("✅ Product options seeded successfully!");
}

seedProductOptions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

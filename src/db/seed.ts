import { db } from "./index";
import {
  categories,
  products,
  services,
  testimonials,
  faqs,
  portfolio,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed Categories
  const categoryData = [
    { name: "Banner", slug: "banner", description: "Berbagai jenis banner untuk promosi indoor dan outdoor" },
    { name: "Sticker", slug: "sticker", description: "Sticker vinyl, chromo, dan berbagai jenis sticker lainnya" },
    { name: "Kartu Nama", slug: "kartu-nama", description: "Kartu nama premium dengan berbagai pilihan finishing" },
    { name: "Brosur", slug: "brosur", description: "Brosur dan flyer untuk promosi bisnis" },
    { name: "Undangan", slug: "undangan", description: "Undangan pernikahan, khitanan, dan berbagai acara" },
    { name: "Poster", slug: "poster", description: "Poster berkualitas tinggi dalam berbagai ukuran" },
    { name: "Kalender", slug: "kalender", description: "Kalender dinding dan meja custom" },
    { name: "Signage", slug: "signage", description: "Neon box, papan nama, dan berbagai signage" },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  console.log(`✅ Inserted ${insertedCategories.length} categories`);

  // Seed Products
  const productData: {
    categoryId: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    basePrice: string;
    unit: string;
    minOrder: number;
    productionDays: number;
    isFeatured: boolean;
    specifications: Record<string, string>;
  }[] = [
    {
      categoryId: insertedCategories[0].id, // Banner
      name: "Banner Flexi Korea",
      slug: "banner-flexi-korea",
      shortDescription: "Banner outdoor dengan bahan flexi korea yang tahan cuaca",
      description: "Banner flexi korea adalah pilihan terbaik untuk kebutuhan promosi outdoor. Bahan tebal, tahan air, dan warna cerah. Cocok untuk spanduk toko, event, dan promosi outdoor lainnya.",
      basePrice: "25000",
      unit: "m²",
      minOrder: 1,
      productionDays: 1,
      isFeatured: true,
      specifications: { material: "Flexi Korea 280gsm", resolution: "720dpi", finishing: "Mata ayam/selongsong" },
    },
    {
      categoryId: insertedCategories[0].id, // Banner
      name: "X-Banner Complete",
      slug: "x-banner-complete",
      shortDescription: "Paket lengkap X-Banner dengan standing dan cetak",
      description: "Paket X-Banner lengkap sudah termasuk cetak albatros dan standing aluminium. Ukuran standar 60x160cm, cocok untuk pameran dan promosi indoor.",
      basePrice: "85000",
      unit: "pcs",
      minOrder: 1,
      productionDays: 2,
      isFeatured: true,
      specifications: { size: "60x160cm", material: "Albatros", standing: "Aluminium" },
    },
    {
      categoryId: insertedCategories[1].id, // Sticker
      name: "Sticker Vinyl Glossy",
      slug: "sticker-vinyl-glossy",
      shortDescription: "Sticker vinyl dengan finishing glossy mengkilap",
      description: "Sticker vinyl glossy berkualitas tinggi dengan daya rekat kuat. Tahan air dan cocok untuk indoor maupun outdoor.",
      basePrice: "150000",
      unit: "m²",
      minOrder: 1,
      productionDays: 1,
      isFeatured: true,
      specifications: { material: "Vinyl Glossy", resolution: "1440dpi", waterproof: "Ya" },
    },
    {
      categoryId: insertedCategories[2].id, // Kartu Nama
      name: "Kartu Nama Premium",
      slug: "kartu-nama-premium",
      shortDescription: "Kartu nama dengan kertas art carton dan finishing doff",
      description: "Kartu nama profesional dengan kertas Art Carton 310gsm. Tersedia pilihan finishing glossy, doff, atau laminasi.",
      basePrice: "75000",
      unit: "box",
      minOrder: 1,
      productionDays: 3,
      isFeatured: true,
      specifications: { paper: "Art Carton 310gsm", quantity: "500 lembar", size: "9x5.5cm" },
    },
    {
      categoryId: insertedCategories[3].id, // Brosur
      name: "Brosur A4",
      slug: "brosur-a4",
      shortDescription: "Brosur ukuran A4 dengan kertas art paper",
      description: "Brosur promosi ukuran A4 (21x29.7cm) dengan kertas Art Paper 150gsm. Cetak full color bolak-balik.",
      basePrice: "1500",
      unit: "lembar",
      minOrder: 100,
      productionDays: 3,
      isFeatured: false,
      specifications: { paper: "Art Paper 150gsm", size: "A4 (21x29.7cm)", print: "Full color 2 sisi" },
    },
    {
      categoryId: insertedCategories[4].id, // Undangan
      name: "Undangan Pernikahan",
      slug: "undangan-pernikahan",
      shortDescription: "Undangan pernikahan elegan dengan amplop",
      description: "Undangan pernikahan dengan desain elegan dan kertas berkualitas. Sudah termasuk amplop dan cetak nama tamu.",
      basePrice: "3500",
      unit: "pcs",
      minOrder: 100,
      productionDays: 5,
      isFeatured: true,
      specifications: { paper: "Art Carton 260gsm", includes: "Amplop + cetak nama" },
    },
    {
      categoryId: insertedCategories[5].id, // Poster
      name: "Poster A2",
      slug: "poster-a2",
      shortDescription: "Poster ukuran A2 dengan cetak digital berkualitas",
      description: "Poster ukuran A2 (42x59.4cm) dengan cetak digital full color. Cocok untuk promosi, dekorasi, atau event.",
      basePrice: "12000",
      unit: "lembar",
      minOrder: 1,
      productionDays: 1,
      isFeatured: false,
      specifications: { paper: "Art Paper 150gsm", size: "A2 (42x59.4cm)", print: "Full color" },
    },
    {
      categoryId: insertedCategories[6].id, // Kalender
      name: "Kalender Dinding",
      slug: "kalender-dinding",
      shortDescription: "Kalender dinding custom dengan foto/desain sendiri",
      description: "Kalender dinding ukuran 32x48cm dengan 12 lembar + cover. Bisa custom dengan foto atau desain sendiri.",
      basePrice: "8500",
      unit: "pcs",
      minOrder: 50,
      productionDays: 7,
      isFeatured: true,
      specifications: { size: "32x48cm", pages: "12 lembar + cover", spiral: "Putih" },
    },
    {
      categoryId: insertedCategories[7].id, // Signage
      name: "Neon Box",
      slug: "neon-box",
      shortDescription: "Neon box dengan lampu LED untuk papan nama toko",
      description: "Neon box aluminium dengan lampu LED hemat energi. Cocok untuk papan nama toko, restaurant, atau bisnis lainnya.",
      basePrice: "350000",
      unit: "m²",
      minOrder: 1,
      productionDays: 7,
      isFeatured: true,
      specifications: { frame: "Aluminium", light: "LED", face: "Acrylic/Flexi" },
    },
    {
      categoryId: insertedCategories[1].id, // Sticker
      name: "Sticker Chromo",
      slug: "sticker-chromo",
      shortDescription: "Sticker chromo glossy untuk indoor",
      description: "Sticker chromo dengan permukaan glossy mengkilap. Ideal untuk label produk dan sticker indoor.",
      basePrice: "85000",
      unit: "m²",
      minOrder: 1,
      productionDays: 1,
      isFeatured: false,
      specifications: { material: "Chromo", resolution: "1440dpi", waterproof: "Tidak" },
    },
    {
      categoryId: insertedCategories[0].id, // Banner
      name: "Roll Up Banner",
      slug: "roll-up-banner",
      shortDescription: "Roll up banner portable untuk pameran dan event",
      description: "Roll up banner dengan standing portable yang mudah dibawa. Ukuran 85x200cm, cocok untuk pameran dan presentasi.",
      basePrice: "175000",
      unit: "pcs",
      minOrder: 1,
      productionDays: 2,
      isFeatured: false,
      specifications: { size: "85x200cm", material: "Albatros", standing: "Aluminium portable" },
    },
    {
      categoryId: insertedCategories[0].id, // Banner
      name: "Spanduk",
      slug: "spanduk",
      shortDescription: "Spanduk flexi untuk promosi outdoor",
      description: "Spanduk flexi dengan cetak digital full color. Bahan tahan cuaca cocok untuk promosi outdoor.",
      basePrice: "18000",
      unit: "m²",
      minOrder: 1,
      productionDays: 1,
      isFeatured: false,
      specifications: { material: "Flexi China 280gsm", resolution: "720dpi", finishing: "Mata ayam" },
    },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();
  console.log(`✅ Inserted ${insertedProducts.length} products`);

  // Seed Services
  const serviceData = [
    {
      name: "Logo Design",
      slug: "logo-design",
      shortDescription: "Desain logo profesional untuk identitas bisnis Anda",
      description: "Layanan desain logo profesional yang mencerminkan identitas dan nilai bisnis Anda. Termasuk revisi dan file master.",
      startingPrice: "500000",
      estimatedDays: 7,
      isFeatured: true,
      features: ["3 Konsep Awal", "5x Revisi", "File Master (AI, EPS, PDF)", "Mockup Presentasi", "Color Guide"],
      deliverables: ["Logo Final (AI, EPS, PDF, PNG, JPG)", "Brand Guidelines Basic", "Mockup"],
    },
    {
      name: "Brand Identity",
      slug: "brand-identity",
      shortDescription: "Paket lengkap identitas brand untuk bisnis profesional",
      description: "Paket branding lengkap termasuk logo, color palette, typography, stationery design, dan brand guidelines.",
      startingPrice: "2500000",
      estimatedDays: 14,
      isFeatured: true,
      features: ["Logo Design", "Color Palette", "Typography System", "Stationery Design", "Brand Guidelines"],
      deliverables: ["Logo Package", "Kartu Nama", "Kop Surat", "Amplop", "Brand Guidelines PDF"],
    },
    {
      name: "Social Media Design",
      slug: "social-media-design",
      shortDescription: "Desain konten social media yang menarik",
      description: "Layanan desain untuk kebutuhan konten social media Instagram, Facebook, dan platform lainnya.",
      startingPrice: "75000",
      estimatedDays: 2,
      isFeatured: true,
      features: ["Desain Feed Instagram", "Story Template", "Cover Facebook", "Revisi 2x"],
      deliverables: ["File JPG/PNG High Resolution", "File Edit (PSD/AI)"],
    },
    {
      name: "Packaging Design",
      slug: "packaging-design",
      shortDescription: "Desain kemasan produk yang menarik",
      description: "Layanan desain kemasan produk untuk makanan, minuman, kosmetik, dan berbagai produk lainnya.",
      startingPrice: "750000",
      estimatedDays: 7,
      isFeatured: true,
      features: ["Konsep Custom", "3D Mockup", "Revisi 3x", "File Siap Cetak"],
      deliverables: ["File Master (AI/PDF)", "3D Mockup", "Dieline Template"],
    },
  ];

  const insertedServices = await db.insert(services).values(serviceData).returning();
  console.log(`✅ Inserted ${insertedServices.length} services`);

  // Seed Testimonials
  const testimonialData = [
    {
      name: "Ahmad Fauzi",
      role: "Owner",
      company: "Toko Berkah Jaya",
      content: "Hasil cetak banner dan spanduk sangat memuaskan. Warna cerah, bahan kuat, dan pengerjaan cepat. Sudah langganan sejak 2019!",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Siti Rahayu",
      role: "Marketing Manager",
      company: "PT Maju Bersama",
      content: "Tim Madina sangat profesional dalam mendesain company profile kami. Hasilnya melebihi ekspektasi dan deadline selalu tepat.",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Budi Santoso",
      role: "Owner",
      company: "Warung Mbak Sri",
      content: "Harga terjangkau untuk kualitas premium. Menu dan banner untuk warung saya terlihat sangat profesional sekarang.",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Dewi Lestari",
      role: "Event Organizer",
      company: "Dewi Events",
      content: "Partner terbaik untuk semua kebutuhan event display. Backdrop, x-banner, hingga undangan selalu on time dan berkualitas.",
      rating: 5,
      isFeatured: true,
    },
    {
      name: "Hendra Wijaya",
      role: "Owner",
      company: "Batik Kedu",
      content: "Logo dan branding untuk toko batik saya sangat bagus. Tim Madina memahami konsep yang saya inginkan dengan baik.",
      rating: 5,
      isFeatured: false,
    },
  ];

  const insertedTestimonials = await db.insert(testimonials).values(testimonialData).returning();
  console.log(`✅ Inserted ${insertedTestimonials.length} testimonials`);

  // Seed FAQs
  const faqData = [
    {
      question: "Berapa lama waktu pengerjaan untuk pesanan cetak?",
      answer: "Waktu pengerjaan bervariasi tergantung jenis produk. Banner dan sticker biasanya 1-2 hari kerja, kartu nama 2-3 hari kerja, dan untuk produk khusus seperti buku atau kemasan bisa 5-7 hari kerja. Kami juga menyediakan layanan express untuk kebutuhan mendesak.",
      category: "Produksi",
      order: 1,
    },
    {
      question: "Apakah bisa memesan dengan desain sendiri?",
      answer: "Tentu! Anda bisa mengupload file desain sendiri dalam format AI, PSD, PDF, atau gambar dengan resolusi tinggi. Tim kami akan melakukan pengecekan file dan memberikan konfirmasi sebelum masuk produksi.",
      category: "Desain",
      order: 2,
    },
    {
      question: "Bagaimana cara pembayaran?",
      answer: "Kami menerima pembayaran melalui Transfer Bank (BCA, Mandiri, BRI), E-Wallet (OVO, GoPay, Dana), dan pembayaran langsung di lokasi. Untuk pesanan tertentu, tersedia opsi pembayaran DP 50%.",
      category: "Pembayaran",
      order: 3,
    },
    {
      question: "Apakah tersedia pengiriman ke luar kota?",
      answer: "Ya, kami melayani pengiriman ke seluruh Indonesia melalui ekspedisi terpercaya seperti JNE, J&T, SiCepat, dan AnterAja. Biaya pengiriman dihitung berdasarkan berat dan tujuan.",
      category: "Pengiriman",
      order: 4,
    },
    {
      question: "Bagaimana jika hasil cetak tidak sesuai?",
      answer: "Kepuasan pelanggan adalah prioritas kami. Jika hasil cetak tidak sesuai dengan preview yang telah disetujui (bukan karena kesalahan file dari customer), kami akan melakukan cetak ulang tanpa biaya tambahan.",
      category: "Garansi",
      order: 5,
    },
    {
      question: "Apakah melayani desain dari nol?",
      answer: "Ya, kami memiliki tim desainer profesional yang siap membantu membuat desain sesuai kebutuhan Anda. Mulai dari logo, branding, hingga desain marketing material lengkap.",
      category: "Desain",
      order: 6,
    },
  ];

  const insertedFaqs = await db.insert(faqs).values(faqData).returning();
  console.log(`✅ Inserted ${insertedFaqs.length} FAQs`);

  // Seed Portfolio
  const portfolioData = [
    {
      title: "Branding Warung Makan Sederhana",
      slug: "branding-warung-makan-sederhana",
      description: "Rebranding lengkap untuk warung makan dengan konsep modern dan minimalis.",
      category: "Branding",
      client: "Warung Mbak Sri",
      tags: ["Logo", "Menu", "Signage"],
      isFeatured: true,
    },
    {
      title: "Company Profile PT Maju Jaya",
      slug: "company-profile-pt-maju-jaya",
      description: "Desain dan cetak company profile 24 halaman untuk perusahaan manufaktur.",
      category: "Design",
      client: "PT Maju Jaya",
      tags: ["Company Profile", "Print"],
      isFeatured: true,
    },
    {
      title: "Event Backdrop Wedding",
      slug: "event-backdrop-wedding",
      description: "Backdrop custom untuk acara pernikahan dengan tema rustic garden.",
      category: "Printing",
      client: "Wedding Organizer ABC",
      tags: ["Backdrop", "Banner", "Event"],
      isFeatured: true,
    },
    {
      title: "Packaging Design Snack",
      slug: "packaging-design-snack",
      description: "Desain kemasan untuk produk snack dengan konsep playful dan colorful.",
      category: "Branding",
      client: "Snack Krispi",
      tags: ["Packaging", "Design"],
      isFeatured: true,
    },
    {
      title: "Neon Box Toko Elektronik",
      slug: "neon-box-toko-elektronik",
      description: "Pembuatan neon box ukuran 2x1 meter dengan lampu LED.",
      category: "Advertising",
      client: "Toko Elektronik Jaya",
      tags: ["Neon Box", "Signage"],
      isFeatured: false,
    },
    {
      title: "Social Media Kit UMKM",
      slug: "social-media-kit-umkm",
      description: "Paket desain social media lengkap untuk brand batik lokal.",
      category: "Design",
      client: "Batik Kedu",
      tags: ["Social Media", "Design"],
      isFeatured: false,
    },
  ];

  const insertedPortfolio = await db.insert(portfolio).values(portfolioData).returning();
  console.log(`✅ Inserted ${insertedPortfolio.length} portfolio items`);

  console.log("✅ Database seeded successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

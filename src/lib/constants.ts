// Brand Constants
export const BRAND = {
  name: "Madina Solution",
  tagline: "Creative Business Platform",
  description:
    "Dari desain hingga produksi, Madina Solution membantu bisnis menghadirkan identitas visual yang kuat, konsisten, dan siap tampil di dunia nyata.",
  whatsapp: "6281393005035",
  email: "Perc.madina@gmail.com",
  address:
    "Dusun Ngleri, Desa Ngadimulyo, Kecamatan Kedu, Kabupaten Temanggung, Jawa Tengah, Indonesia",
  website: "madinasolution.web.app",
} as const;

// Design Tokens
export const COLORS = {
  primary: "#E8590C",
  primaryDark: "#C44D0A",
  primaryLight: "#FF6B1A",
  dark: "#1A1A1A",
  warmAccent: "#FFF7ED",
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/services" },
  { label: "Produk", href: "/products" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Tentang", href: "/about" },
  { label: "Kontak", href: "/contact" },
] as const;

// Order Status
export const ORDER_STATUS = {
  draft: { label: "Draft", color: "gray" },
  pending: { label: "Menunggu Konfirmasi", color: "yellow" },
  confirmed: { label: "Dikonfirmasi", color: "blue" },
  design_review: { label: "Review Desain", color: "purple" },
  design_approved: { label: "Desain Disetujui", color: "indigo" },
  production: { label: "Produksi", color: "orange" },
  quality_control: { label: "Quality Control", color: "cyan" },
  ready: { label: "Siap", color: "teal" },
  shipping: { label: "Pengiriman", color: "blue" },
  completed: { label: "Selesai", color: "green" },
  cancelled: { label: "Dibatalkan", color: "red" },
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  unpaid: { label: "Belum Bayar", color: "red" },
  partial: { label: "Sebagian", color: "yellow" },
  paid: { label: "Lunas", color: "green" },
  refunded: { label: "Refund", color: "gray" },
} as const;

// User Roles
export const USER_ROLES = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
  designer: "Designer",
  production: "Production",
  customer: "Customer",
} as const;

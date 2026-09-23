import { db } from "@/db";
import { orders, products, services, users, orderItems, messages, reviews, coupons } from "@/db/schema";
import { eq, count, sum, desc, sql, gte, lt, and, or, isNull } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock3,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  MessageSquare,
  Star,
  Ticket,
  BriefcaseBusiness,
  Plus,
  FileText,
  AlertCircle,
  BarChart3,
  Boxes,
  BadgeDollarSign,
  Sparkles,
  ChevronDown,
  CalendarDays,
  MoreVertical,
} from "lucide-react";
import { RevenueChart } from "./revenue-chart";
import { PipelineChart } from "./pipeline-chart";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300" },
  confirmed: { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  design_review: { label: "Review Desain", color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  design_approved: { label: "Desain OK", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  production: { label: "Produksi", color: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  quality_control: { label: "QC", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300" },
  ready: { label: "Siap", color: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300" },
  shipping: { label: "Dikirim", color: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  completed: { label: "Selesai", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
};

const PIPELINE_GROUPS: { stage: string; statuses: string[] }[] = [
  { stage: "Menunggu", statuses: ["draft", "pending"] },
  { stage: "Konfirmasi", statuses: ["confirmed"] },
  { stage: "Desain", statuses: ["design_review", "design_approved"] },
  { stage: "Produksi", statuses: ["production", "quality_control", "ready"] },
  { stage: "Pengiriman", statuses: ["shipping"] },
  { stage: "Selesai", statuses: ["completed"] },
];

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs font-medium text-dark-400">Tidak ada pembanding</span>;
  const isUp = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
      {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value)}%
    </span>
  );
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start30d = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  start30d.setHours(0, 0, 0, 0);

  const [
    revenueThisMonth,
    revenueLastMonth,
    ordersThisMonth,
    ordersLastMonth,
    customersThisMonth,
    customersLastMonth,
    totalProductsResult,
    totalServicesResult,
    pendingOrdersResult,
    unreadMessagesResult,
    pendingReviewsResult,
    activeCouponsResult,
    dailyRevenueRows,
    statusBreakdownRows,
    topProductsRows,
    recentOrdersList,
    recentMessagesList,
    recentReviewsList,
  ] = await Promise.all([
    db.select({ value: sum(orders.total) }).from(orders).where(gte(orders.createdAt, startOfThisMonth)),
    db.select({ value: sum(orders.total) }).from(orders).where(and(gte(orders.createdAt, startOfLastMonth), lt(orders.createdAt, startOfThisMonth))),
    db.select({ value: count() }).from(orders).where(gte(orders.createdAt, startOfThisMonth)),
    db.select({ value: count() }).from(orders).where(and(gte(orders.createdAt, startOfLastMonth), lt(orders.createdAt, startOfThisMonth))),
    db.select({ value: count() }).from(users).where(and(eq(users.role, "customer"), gte(users.createdAt, startOfThisMonth))),
    db.select({ value: count() }).from(users).where(and(eq(users.role, "customer"), gte(users.createdAt, startOfLastMonth), lt(users.createdAt, startOfThisMonth))),
    db.select({ value: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ value: count() }).from(services).where(eq(services.isActive, true)),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ value: count() }).from(messages).where(eq(messages.isRead, false)),
    db.select({ value: count() }).from(reviews).where(eq(reviews.isApproved, false)),
    db.select({ value: count() }).from(coupons).where(and(eq(coupons.isActive, true), or(isNull(coupons.endDate), gte(coupons.endDate, now)))),
    db.select({ day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`, revenue: sum(orders.total) }).from(orders).where(gte(orders.createdAt, start30d)).groupBy(sql`1`).orderBy(sql`1`),
    db.select({ status: orders.status, value: count() }).from(orders).groupBy(orders.status),
    db.select({ productId: orderItems.productId, name: sql<string>`max(${orderItems.name})`, orderCount: count(), revenue: sum(orderItems.subtotal) }).from(orderItems).where(sql`${orderItems.productId} is not null`).groupBy(orderItems.productId).orderBy(desc(count())).limit(5),
    db.select({ id: orders.id, orderNumber: orders.orderNumber, guestName: orders.guestName, guestEmail: orders.guestEmail, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total, createdAt: orders.createdAt }).from(orders).orderBy(desc(orders.createdAt)).limit(5),
    db.select({ id: messages.id, content: messages.content, createdAt: messages.createdAt, senderName: users.name }).from(messages).leftJoin(users, eq(messages.senderId, users.id)).orderBy(desc(messages.createdAt)).limit(3),
    db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, userName: users.name }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).orderBy(desc(reviews.createdAt)).limit(3),
  ]);

  const revenueThisMonthNum = Number(revenueThisMonth[0]?.value ?? 0);
  const revenueLastMonthNum = Number(revenueLastMonth[0]?.value ?? 0);
  const ordersThisMonthNum = ordersThisMonth[0]?.value ?? 0;
  const ordersLastMonthNum = ordersLastMonth[0]?.value ?? 0;
  const customersThisMonthNum = customersThisMonth[0]?.value ?? 0;
  const customersLastMonthNum = customersLastMonth[0]?.value ?? 0;
  const totalProducts = totalProductsResult[0]?.value ?? 0;
  const totalServices = totalServicesResult[0]?.value ?? 0;
  const pendingOrders = pendingOrdersResult[0]?.value ?? 0;
  const unreadMessages = unreadMessagesResult[0]?.value ?? 0;
  const pendingReviews = pendingReviewsResult[0]?.value ?? 0;
  const activeCoupons = activeCouponsResult[0]?.value ?? 0;

  const revenueByDay = new Map(dailyRevenueRows.map((r) => [r.day, Number(r.revenue ?? 0)]));
  const revenueChartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start30d.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, revenue: revenueByDay.get(key) ?? 0 };
  });

  const statusCounts = new Map<string, number>(statusBreakdownRows.map((r) => [r.status, r.value]));
  const pipelineChartData = PIPELINE_GROUPS.map((group) => ({ stage: group.stage, count: group.statuses.reduce((total, status) => total + (statusCounts.get(status) ?? 0), 0) }));
  const cancelledCount = statusCounts.get("cancelled") ?? 0;

  const recentActivity = [
    ...recentOrdersList.map((o) => ({ type: "order" as const, id: o.id, title: `Pesanan baru ${o.orderNumber}`, subtitle: o.guestName || o.guestEmail || "Pelanggan", createdAt: o.createdAt, href: `/admin/orders/${o.id}` })),
    ...recentMessagesList.map((m) => ({ type: "message" as const, id: m.id, title: `Pesan dari ${m.senderName || "Pengguna"}`, subtitle: m.content.slice(0, 60), createdAt: m.createdAt, href: "/admin/messages" })),
    ...recentReviewsList.map((r) => ({ type: "review" as const, id: r.id, title: `Review ${r.rating}★ dari ${r.userName || "Pengguna"}`, subtitle: r.comment?.slice(0, 60) || "Tanpa komentar", createdAt: r.createdAt, href: "/admin/reviews" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  const needsAttention = [
    { count: pendingOrders, label: "pesanan menunggu konfirmasi", href: "/admin/orders?status=pending", icon: Clock3 },
    { count: unreadMessages, label: "pesan belum dibaca", href: "/admin/messages", icon: Mail },
    { count: pendingReviews, label: "review menunggu persetujuan", href: "/admin/reviews", icon: Star },
  ].filter((item) => item.count > 0);

  const stats = [
    { label: "Pendapatan Bulan Ini", value: formatCurrency(revenueThisMonthNum), trend: pctChange(revenueThisMonthNum, revenueLastMonthNum), icon: DollarSign, iconBox: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300", href: "/admin/orders" },
    { label: "Pesanan Bulan Ini", value: String(ordersThisMonthNum), trend: pctChange(ordersThisMonthNum, ordersLastMonthNum), icon: ShoppingCart, iconBox: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300", href: "/admin/orders" },
    { label: "Pelanggan Baru", value: String(customersThisMonthNum), trend: pctChange(customersThisMonthNum, customersLastMonthNum), icon: Users, iconBox: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300", href: "/admin/customers" },
    { label: "Menunggu Konfirmasi", value: String(pendingOrders), trend: null, icon: Clock3, iconBox: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300", href: "/admin/orders?status=pending" },
    { label: "Produk Aktif", value: String(totalProducts), trend: null, icon: Boxes, iconBox: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300", href: "/admin/products" },
    { label: "Layanan Aktif", value: String(totalServices), trend: null, icon: BriefcaseBusiness, iconBox: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300", href: "/admin/services" },
    { label: "Pesan Belum Dibaca", value: String(unreadMessages), trend: null, icon: Mail, iconBox: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300", href: "/admin/messages" },
    { label: "Kupon Aktif", value: String(activeCoupons), trend: null, icon: Ticket, iconBox: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300", href: "/admin/coupons" },
  ];

  const quickActions = [
    { label: "Tambah Produk", detail: "Buat produk baru", href: "/admin/products", icon: Plus, tone: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-300" },
    { label: "Tulis Artikel", detail: "Buat konten blog", href: "/admin/articles", icon: FileText, tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300" },
    { label: "Lihat Pesan Masuk", detail: "Cek pesan pelanggan", href: "/admin/messages", icon: MessageSquare, tone: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300" },
    { label: "Kelola Kupon", detail: "Buat dan atur kupon", href: "/admin/coupons", icon: Ticket, tone: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-300" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-dark-100 bg-white px-5 py-6 shadow-[0_16px_44px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-36 top-2 h-40 w-40 rounded-full bg-orange-200/25 blur-3xl dark:bg-orange-500/10" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Selamat datang kembali</div>
            <h1 className="mt-2 text-[34px] font-black tracking-[-0.04em] text-dark-900 dark:text-white sm:text-[42px]">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-dark-500 dark:text-slate-400">Ringkasan operasional Madina Solution — {formatDate(now)}. Pantau pesanan, penjualan, produksi, dan aktivitas pelanggan dari satu tempat.</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-light px-5 py-4 text-white shadow-[0_12px_28px_rgba(196,77,10,0.22)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><BarChart3 className="h-5 w-5" /></div>
            <div className="relative"><p className="text-xs font-medium text-white/80">Kelola bisnis lebih mudah,</p><p className="mt-0.5 text-sm font-extrabold">tumbuh lebih cepat.</p></div>
          </div>
        </div>
      </section>

      {needsAttention.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-amber-900 dark:text-amber-200"><AlertCircle className="h-4 w-4" /> Perlu perhatian</div>
            <div className="flex flex-1 flex-wrap gap-2">
              {needsAttention.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-dark-700 shadow-sm ring-1 ring-black/5 hover:ring-primary/20 dark:bg-slate-900 dark:text-slate-200"><Icon className="h-3.5 w-3.5 text-primary" /><strong>{item.count}</strong> {item.label}</Link>; })}
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="group relative rounded-[22px] border border-dark-100 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.035)] dark:border-slate-800 dark:bg-slate-950 sm:p-5">
              <details className="absolute right-3 top-3 [&::-webkit-details-marker]:hidden">
                <summary className="flex h-7 w-7 list-none items-center justify-center rounded-lg text-dark-300 outline-none hover:bg-dark-50 hover:text-dark-600 dark:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-300"><MoreVertical className="h-4 w-4" /></summary>
                <div className="absolute right-0 top-8 z-10 w-40 overflow-hidden rounded-xl border border-dark-100 bg-white py-1 shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900">
                  <Link href={stat.href} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-dark-700 hover:bg-dark-50 dark:text-slate-200 dark:hover:bg-slate-800">Lihat Detail <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </details>
              <div className="flex items-start justify-between gap-4 pr-6"><div className="min-w-0"><p className="truncate text-xs font-semibold text-dark-500 dark:text-slate-400">{stat.label}</p><p className="mt-2 text-[27px] font-black tracking-[-0.03em] text-dark-900 dark:text-white">{stat.value}</p><div className="mt-1.5 flex items-center gap-1.5"><TrendBadge value={stat.trend} />{stat.trend !== null && <span className="text-[11px] font-medium text-dark-400">vs bulan lalu</span>}</div></div><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${stat.iconBox}`}><Icon className="h-[19px] w-[19px]" /></div></div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
        <article className="rounded-[24px] border border-dark-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><BadgeDollarSign className="h-4 w-4" /></span><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Tren Pendapatan</h2></div><p className="mt-2 pl-10 text-xs text-dark-400">30 hari terakhir</p></div><button type="button" className="inline-flex items-center gap-2 rounded-xl border border-dark-100 bg-dark-50 px-3 py-2 text-xs font-semibold text-dark-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> 30 Hari Terakhir <ChevronDown className="h-3.5 w-3.5" /></button></div>
          <div className="mt-3"><RevenueChart data={revenueChartData} /></div>
        </article>

        <article className="rounded-[24px] border border-dark-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300"><ShoppingCart className="h-4 w-4" /></span><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Pipeline Pesanan</h2></div><p className="mt-2 pl-10 text-xs text-dark-400">Distribusi status aktif</p></div><Link href="/admin/orders" className="flex h-9 w-9 items-center justify-center rounded-xl border border-dark-100 text-dark-400 hover:text-primary dark:border-slate-800"><ArrowRight className="h-4 w-4" /></Link></div>
          {cancelledCount > 0 && <p className="mt-3 text-xs text-dark-400">{cancelledCount} pesanan dibatalkan</p>}
          <div className="mt-2"><PipelineChart data={pipelineChartData} /></div>
        </article>
      </section>

      <section className="rounded-[24px] border border-dark-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><ZapIcon /></span><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Aksi Cepat</h2></div></div><span className="text-xs font-semibold text-dark-400">Shortcut operasional</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => { const Icon = action.icon; return <Link key={action.href} href={action.href} className="group flex items-center gap-3 rounded-2xl border border-dark-100 bg-dark-50/55 p-3.5 hover:border-primary/20 hover:bg-primary/[0.035] dark:border-slate-800 dark:bg-slate-900/50"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.tone}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-dark-800 dark:text-slate-100">{action.label}</span><span className="mt-0.5 block truncate text-[11px] font-medium text-dark-400">{action.detail}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-dark-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></Link>; })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.6fr)]">
        <article className="rounded-[24px] border border-dark-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Produk Terlaris</h2><p className="mt-1 text-xs text-dark-400">Berbasis jumlah order item</p></div><Boxes className="h-5 w-5 text-primary" /></div>
          {topProductsRows.length > 0 ? <ul className="mt-4 space-y-2.5">{topProductsRows.map((product, index) => <li key={product.productId ?? index} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-dark-50 dark:hover:bg-slate-900"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-dark-800 dark:text-slate-100">{product.name}</p><p className="mt-0.5 text-[11px] text-dark-400">{product.orderCount} pesanan</p></div><span className="shrink-0 text-xs font-extrabold text-dark-800 dark:text-slate-100">{formatCurrency(Number(product.revenue ?? 0))}</span></li>)}</ul> : <p className="mt-5 text-sm text-dark-400">Belum ada data penjualan.</p>}
        </article>

        <article className="rounded-[24px] border border-dark-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><div><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Aktivitas Terbaru</h2><p className="mt-1 text-xs text-dark-400">Pesanan, pesan, dan review</p></div><Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">Lihat semua</Link></div>{recentActivity.length > 0 ? <ul className="mt-3 divide-y divide-dark-100/80 dark:divide-slate-800">{recentActivity.map((item) => <li key={`${item.type}-${item.id}`}><Link href={item.href} className="flex items-center gap-3 py-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.type === "order" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" : item.type === "message" ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300" : "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300"}`}>{item.type === "order" ? <ShoppingCart className="h-4 w-4" /> : item.type === "message" ? <Mail className="h-4 w-4" /> : <Star className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-dark-800 dark:text-slate-100">{item.title}</p><p className="mt-0.5 truncate text-[11px] text-dark-400">{item.subtitle}</p></div><span className="shrink-0 text-[10px] font-medium text-dark-400">{formatDate(item.createdAt)}</span></Link></li>)}</ul> : <p className="mt-5 text-sm text-dark-400">Belum ada aktivitas.</p>}</article>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-dark-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-100 px-5 py-4 dark:border-slate-800"><div><h2 className="text-[15px] font-extrabold text-dark-900 dark:text-white">Pesanan Terbaru</h2><p className="mt-1 text-xs text-dark-400">5 order paling baru</p></div><Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">Lihat Semua <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        {recentOrdersList.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-dark-100 bg-dark-50/70 text-left dark:border-slate-800 dark:bg-slate-900/70"><th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-dark-400">No. Pesanan</th><th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-dark-400">Pelanggan</th><th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-dark-400">Status</th><th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-dark-400">Pembayaran</th><th className="px-5 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-dark-400">Total</th></tr></thead><tbody>{recentOrdersList.map((order) => { const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: "bg-dark-100 text-dark-700 dark:bg-slate-800 dark:text-slate-300" }; return <tr key={order.id} className="border-b border-dark-50 last:border-0 hover:bg-dark-50/50 dark:border-slate-900 dark:hover:bg-slate-900/50"><td className="px-5 py-3.5"><Link href={`/admin/orders/${order.id}`} className="font-bold text-primary hover:underline">{order.orderNumber}</Link></td><td className="px-5 py-3.5 font-medium text-dark-700 dark:text-slate-300">{order.guestName || "—"}</td><td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusInfo.color}`}>{statusInfo.label}</span></td><td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"}`}>{order.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}</span></td><td className="px-5 py-3.5 text-right font-extrabold text-dark-900 dark:text-white">{formatCurrency(Number(order.total))}</td></tr>; })}</tbody></table></div> : <div className="px-5 py-12 text-center text-sm text-dark-400">Belum ada pesanan.</div>}
      </section>
    </div>
  );
}

function ZapIcon() {
  return <span className="text-lg leading-none">ϟ</span>;
}

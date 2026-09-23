import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, eq, ilike, or, and, asc, type SQL } from "drizzle-orm";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminOrderFilters } from "./order-filters";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-700" },
  design_review: { label: "Review Desain", color: "bg-purple-100 text-purple-700" },
  design_approved: { label: "Desain OK", color: "bg-indigo-100 text-indigo-700" },
  production: { label: "Produksi", color: "bg-orange-100 text-orange-700" },
  quality_control: { label: "QC", color: "bg-cyan-100 text-cyan-700" },
  ready: { label: "Siap", color: "bg-teal-100 text-teal-700" },
  shipping: { label: "Dikirim", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Selesai", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusFilter = typeof params.status === "string" ? params.status : undefined;
  const paymentFilter = typeof params.payment === "string" ? params.payment : undefined;
  const searchQuery = typeof params.q === "string" ? params.q : undefined;

  const conditions: SQL[] = [];
  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(orders.status, statusFilter as typeof orders.status.enumValues[number]));
  }
  if (paymentFilter && paymentFilter !== "all") {
    conditions.push(eq(orders.paymentStatus, paymentFilter as typeof orders.paymentStatus.enumValues[number]));
  }
  if (searchQuery) {
    const term = `%${searchQuery}%`;
    conditions.push(or(
      ilike(orders.orderNumber, term),
      ilike(orders.guestName, term),
      ilike(orders.guestEmail, term),
      ilike(orders.guestPhone, term)
    )!);
  }

  const orderList = await db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Pesanan</h1>
        <p className="mt-1 text-dark-500">{orderList.length} pesanan ditemukan</p>
      </div>

      <AdminOrderFilters
        currentStatus={statusFilter}
        currentPayment={paymentFilter}
        currentSearch={searchQuery}
      />

      <div className="rounded-2xl border border-dark-100 bg-white">
        {orderList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-100 text-left">
                  <th className="px-5 py-3 font-medium text-dark-500">No. Pesanan</th>
                  <th className="px-5 py-3 font-medium text-dark-500">Pelanggan</th>
                  <th className="px-5 py-3 font-medium text-dark-500">Status</th>
                  <th className="px-5 py-3 font-medium text-dark-500">Pembayaran</th>
                  <th className="px-5 py-3 text-right font-medium text-dark-500">Total</th>
                  <th className="px-5 py-3 font-medium text-dark-500">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order) => {
                  const si = STATUS_LABELS[order.status] || { label: order.status, color: "bg-dark-100 text-dark-600" };
                  return (
                    <tr key={order.id} className="border-b border-dark-50 transition-colors hover:bg-dark-50/50 last:border-0">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary hover:underline">{order.orderNumber}</Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-dark">{order.guestName || "—"}</p>
                        <p className="text-xs text-dark-400">{order.guestEmail || ""}</p>
                      </td>
                      <td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${si.color}`}>{si.label}</span></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {order.paymentStatus === "paid" ? "Lunas" : "Belum Bayar"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-dark">{formatCurrency(Number(order.total))}</td>
                      <td className="px-5 py-3.5 text-dark-500 text-xs">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-dark-500">
            {searchQuery || statusFilter ? "Tidak ada pesanan yang cocok dengan filter." : "Belum ada pesanan."}
          </div>
        )}
      </div>
    </div>
  );
}

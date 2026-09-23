import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { eq, and, desc, or, count } from "drizzle-orm";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, CheckCircle2, Palette, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const DESIGN_STATUSES = ["confirmed", "design_review", "design_approved"];

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Menunggu Desain", color: "bg-yellow-100 text-yellow-700" },
  design_review: { label: "Review Desain", color: "bg-purple-100 text-purple-700" },
  design_approved: { label: "Desain Disetujui", color: "bg-green-100 text-green-700" },
};

export default async function DesignWorkspacePage() {
  // Get design-related orders
  const designOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      guestName: orders.guestName,
      status: orders.status,
      priority: orders.priority,
      total: orders.total,
      estimatedCompletion: orders.estimatedCompletion,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(or(
      eq(orders.status, "confirmed"),
      eq(orders.status, "design_review"),
      eq(orders.status, "design_approved")
    ))
    .orderBy(desc(orders.createdAt));

  // Counts per status
  const waitingCount = designOrders.filter(o => o.status === "confirmed").length;
  const reviewCount = designOrders.filter(o => o.status === "design_review").length;
  const approvedCount = designOrders.filter(o => o.status === "design_approved").length;
  const urgentCount = designOrders.filter(o => o.priority === "urgent" || o.priority === "high").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Design Workspace</h1>
        <p className="mt-1 text-dark-500">Kelola pekerjaan desain</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Menunggu Desain</p>
              <p className="mt-1 text-2xl font-bold text-dark">{waitingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Dalam Review</p>
              <p className="mt-1 text-2xl font-bold text-dark">{reviewCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <Palette className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Disetujui</p>
              <p className="mt-1 text-2xl font-bold text-dark">{approvedCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Urgent/High</p>
              <p className="mt-1 text-2xl font-bold text-dark">{urgentCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-dark-100 bg-white">
        <div className="border-b border-dark-100 px-6 py-4">
          <h2 className="font-semibold text-dark">Antrian Desain</h2>
        </div>
        {designOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-100 text-left">
                  <th className="px-6 py-3 font-medium text-dark-500">Order</th>
                  <th className="px-6 py-3 font-medium text-dark-500">Pelanggan</th>
                  <th className="px-6 py-3 font-medium text-dark-500">Status</th>
                  <th className="px-6 py-3 font-medium text-dark-500">Prioritas</th>
                  <th className="px-6 py-3 font-medium text-dark-500">Deadline</th>
                  <th className="px-6 py-3 text-right font-medium text-dark-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {designOrders.map((order) => {
                  const si = STATUS_INFO[order.status] || { label: order.status, color: "bg-dark-100 text-dark-600" };
                  const priorityColors: Record<string, string> = {
                    urgent: "bg-red-100 text-red-700",
                    high: "bg-orange-100 text-orange-700",
                    normal: "bg-dark-100 text-dark-600",
                    low: "bg-dark-50 text-dark-500",
                  };
                  return (
                    <tr key={order.id} className="border-b border-dark-50 transition-colors hover:bg-dark-50/50 last:border-0">
                      <td className="px-6 py-3.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-dark-600">{order.guestName || "—"}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${si.color}`}>{si.label}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${priorityColors[order.priority || "normal"]}`}>
                          {order.priority || "normal"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-dark-500 text-xs">
                        {order.estimatedCompletion ? formatDate(order.estimatedCompletion) : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-dark">{formatCurrency(Number(order.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-dark-500">
            Tidak ada pekerjaan desain saat ini.
          </div>
        )}
      </div>
    </div>
  );
}

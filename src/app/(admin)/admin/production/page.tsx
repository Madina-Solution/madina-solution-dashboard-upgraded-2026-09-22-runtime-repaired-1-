import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Clock, Settings, CheckCircle2, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  design_approved: { label: "Siap Produksi", color: "bg-indigo-100 text-indigo-700" },
  production: { label: "Produksi", color: "bg-orange-100 text-orange-700" },
  quality_control: { label: "Quality Control", color: "bg-cyan-100 text-cyan-700" },
  ready: { label: "Siap Kirim", color: "bg-teal-100 text-teal-700" },
  shipping: { label: "Dikirim", color: "bg-blue-100 text-blue-700" },
};

export default async function ProductionWorkspacePage() {
  const productionOrders = await db
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
      eq(orders.status, "design_approved"),
      eq(orders.status, "production"),
      eq(orders.status, "quality_control"),
      eq(orders.status, "ready"),
      eq(orders.status, "shipping")
    ))
    .orderBy(desc(orders.createdAt));

  const queueCount = productionOrders.filter(o => o.status === "design_approved").length;
  const prodCount = productionOrders.filter(o => o.status === "production").length;
  const qcCount = productionOrders.filter(o => o.status === "quality_control").length;
  const readyCount = productionOrders.filter(o => o.status === "ready" || o.status === "shipping").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Production Workspace</h1>
        <p className="mt-1 text-dark-500">Kelola produksi dan quality control</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Antrian</p>
              <p className="mt-1 text-2xl font-bold text-dark">{queueCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Clock className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Produksi</p>
              <p className="mt-1 text-2xl font-bold text-dark">{prodCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Settings className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Quality Control</p>
              <p className="mt-1 text-2xl font-bold text-dark">{qcCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><CheckCircle2 className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-dark-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-500">Siap / Dikirim</p>
              <p className="mt-1 text-2xl font-bold text-dark">{readyCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600"><Truck className="h-6 w-6" /></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dark-100 bg-white">
        <div className="border-b border-dark-100 px-6 py-4">
          <h2 className="font-semibold text-dark">Pipeline Produksi</h2>
        </div>
        {productionOrders.length > 0 ? (
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
                {productionOrders.map((order) => {
                  const si = STATUS_INFO[order.status] || { label: order.status, color: "bg-dark-100 text-dark-600" };
                  const pColors: Record<string, string> = { urgent: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700", normal: "bg-dark-100 text-dark-600", low: "bg-dark-50 text-dark-500" };
                  return (
                    <tr key={order.id} className="border-b border-dark-50 transition-colors hover:bg-dark-50/50 last:border-0">
                      <td className="px-6 py-3.5"><Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary hover:underline">{order.orderNumber}</Link></td>
                      <td className="px-6 py-3.5 text-dark-600">{order.guestName || "—"}</td>
                      <td className="px-6 py-3.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${si.color}`}>{si.label}</span></td>
                      <td className="px-6 py-3.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${pColors[order.priority || "normal"]}`}>{order.priority || "normal"}</span></td>
                      <td className="px-6 py-3.5 text-dark-500 text-xs">{order.estimatedCompletion ? formatDate(order.estimatedCompletion) : "—"}</td>
                      <td className="px-6 py-3.5 text-right font-medium text-dark">{formatCurrency(Number(order.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-dark-500">Tidak ada pekerjaan produksi saat ini.</div>
        )}
      </div>
    </div>
  );
}

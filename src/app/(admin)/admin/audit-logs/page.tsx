import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const list = await db.select({ id: auditLogs.id, action: auditLogs.action, resource: auditLogs.resource, createdAt: auditLogs.createdAt, userName: users.name })
    .from(auditLogs).leftJoin(users, eq(auditLogs.userId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(100);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-dark">Audit Log</h1><p className="mt-1 text-dark-500">{list.length} entri terbaru</p></div>
      <div className="rounded-2xl border border-dark-100 bg-white">
        {list.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-dark-100 text-left">
            <th className="px-6 py-3 font-medium text-dark-500">Aksi</th>
            <th className="px-6 py-3 font-medium text-dark-500">Resource</th>
            <th className="px-6 py-3 font-medium text-dark-500">Oleh</th>
            <th className="px-6 py-3 font-medium text-dark-500">Waktu</th>
          </tr></thead><tbody>
            {list.map((log) => (
              <tr key={log.id} className="border-b border-dark-50 last:border-0">
                <td className="px-6 py-3 font-mono text-xs text-dark">{log.action}</td>
                <td className="px-6 py-3 text-dark-600">{log.resource}</td>
                <td className="px-6 py-3 text-dark-600">{log.userName || "System"}</td>
                <td className="px-6 py-3 text-xs text-dark-500">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <div className="flex flex-col items-center justify-center py-16"><Shield className="h-10 w-10 text-dark-300" /><p className="mt-4 font-semibold text-dark">Belum ada log</p></div>}
      </div>
    </div>
  );
}

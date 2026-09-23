import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Generate a unique, human-readable, sequential order number.
 * Format: MS-YYYY-NNNNNN (e.g. MS-2026-000001)
 * SERVER-ONLY — this file imports db.
 */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MS-${year}-`;

  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM orders WHERE order_number LIKE ${prefix + "%"}`
    );
    const count = Number((result.rows[0] as Record<string, unknown>)?.cnt ?? 0);
    const seq = String(count + 1).padStart(6, "0");
    return `${prefix}${seq}`;
  } catch {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${rand}`;
  }
}

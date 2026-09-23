import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, financeCategories, financeTransactions, orders, payments, users } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const transactionSchema = z.object({
  type: z.enum(["expense", "adjustment"]),
  categoryId: z.string().uuid(),
  description: z.string().trim().min(3).max(500),
  amount: z.coerce.number().positive().max(9_999_999_999),
  transactionDate: z.string().optional(),
  paymentMethod: z.string().trim().max(50).optional(),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

function parseDateInput(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function monthBounds(month: string | null) {
  const base = month && /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : undefined;
  const start = parseDateInput(base || null, new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "finance.read")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Akses ke modul keuangan ditolak" } }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const { start, end } = monthBounds(params.get("month"));

    const baseWhere = and(
      gte(financeTransactions.transactionDate, start),
      lte(financeTransactions.transactionDate, end),
      eq(financeTransactions.status, "posted"),
    );

    const [income, expense, outstanding, pendingVerification, categories, transactionRows] = await Promise.all([
      db.select({ total: sql<string>`coalesce(sum(${financeTransactions.amount}), 0)` }).from(financeTransactions).where(and(baseWhere, eq(financeTransactions.type, "income"))),
      db.select({ total: sql<string>`coalesce(sum(${financeTransactions.amount}), 0)` }).from(financeTransactions).where(and(baseWhere, eq(financeTransactions.type, "expense"))),
      db.select({ total: sql<string>`coalesce(sum(greatest(${orders.total} - coalesce((select sum(${payments.amount}) from ${payments} where ${payments.orderId} = ${orders.id} and ${payments.status} = 'paid'), 0), 0)), 0)` }).from(orders).where(sql`${orders.status} NOT IN ('cancelled', 'draft')`),
      db.select({ count: sql<number>`count(*)`, amount: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(eq(payments.status, "pending_verification")),
      db.select().from(financeCategories).where(eq(financeCategories.isActive, true)).orderBy(asc(financeCategories.sortOrder), asc(financeCategories.name)),
      db.select({
        id: financeTransactions.id,
        type: financeTransactions.type,
        status: financeTransactions.status,
        categoryId: financeTransactions.categoryId,
        categoryName: financeCategories.name,
        orderId: financeTransactions.orderId,
        orderNumber: orders.orderNumber,
        paymentId: financeTransactions.paymentId,
        reference: financeTransactions.reference,
        description: financeTransactions.description,
        amount: financeTransactions.amount,
        currency: financeTransactions.currency,
        paymentMethod: financeTransactions.paymentMethod,
        transactionDate: financeTransactions.transactionDate,
        notes: financeTransactions.notes,
        createdAt: financeTransactions.createdAt,
        customerId: orders.userId,
        customerName: users.name,
        customerEmail: users.email,
        customerRole: users.role,
      }).from(financeTransactions)
        .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
        .leftJoin(orders, eq(financeTransactions.orderId, orders.id))
        .leftJoin(users, eq(orders.userId, users.id))
        .where(and(gte(financeTransactions.transactionDate, start), lte(financeTransactions.transactionDate, end)))
        .orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.createdAt))
        .limit(250),
    ]);

    const incomeTotal = Number(income[0]?.total || 0);
    const expenseTotal = Number(expense[0]?.total || 0);

    return NextResponse.json({
      success: true,
      period: { month: start.toISOString().slice(0, 7), start: start.toISOString(), end: end.toISOString() },
      summary: {
        income: incomeTotal,
        expense: expenseTotal,
        net: incomeTotal - expenseTotal,
        outstanding: Number(outstanding[0]?.total || 0),
        pendingVerification: Number(pendingVerification[0]?.count || 0),
        pendingVerificationAmount: Number(pendingVerification[0]?.amount || 0),
      },
      categories,
      transactions: transactionRows,
    });
  } catch (error) {
    console.error("Admin finance GET error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal memuat data keuangan" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, "finance.manage")) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki izin mengelola keuangan" } }, { status: 403 });
    }
    const parsed = transactionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Data transaksi tidak valid" } }, { status: 400 });

    const category = await db.select().from(financeCategories).where(and(eq(financeCategories.id, parsed.data.categoryId), eq(financeCategories.isActive, true))).limit(1);
    if (!category[0]) return NextResponse.json({ success: false, error: { code: "CATEGORY_INVALID", message: "Kategori keuangan tidak ditemukan atau nonaktif" } }, { status: 400 });
    if (category[0].type === "income" && parsed.data.type === "expense") return NextResponse.json({ success: false, error: { code: "CATEGORY_TYPE_INVALID", message: "Kategori tersebut hanya untuk pemasukan" } }, { status: 400 });

    const transactionDate = parseDateInput(parsed.data.transactionDate ? parsed.data.transactionDate.split("T")[0] : null, new Date());
    const [created] = await db.insert(financeTransactions).values({
      type: parsed.data.type,
      status: "posted",
      categoryId: category[0].id,
      reference: parsed.data.reference || null,
      description: parsed.data.description,
      amount: String(parsed.data.amount),
      currency: "IDR",
      paymentMethod: parsed.data.paymentMethod || null,
      transactionDate,
      notes: parsed.data.notes || null,
      createdBy: session.userId,
    }).returning();

    await db.insert(auditLogs).values({
      userId: session.userId,
      action: "FINANCE_TRANSACTION_CREATED",
      resource: "finance_transactions",
      resourceId: created.id,
      metadata: { type: created.type, category: category[0].name, amount: parsed.data.amount, reference: created.reference },
    });

    return NextResponse.json({ success: true, transaction: created });
  } catch (error) {
    console.error("Admin finance POST error:", error);
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Gagal mencatat transaksi" } }, { status: 500 });
  }
}

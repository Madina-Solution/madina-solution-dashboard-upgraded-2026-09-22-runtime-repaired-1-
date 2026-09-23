import { Metadata } from "next";
import { db } from "@/db";
import { paymentMethods, shippingMethods } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Checkout",
  description: "Selesaikan pesanan Anda di Madina Solution.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [activePaymentMethods, activeShippingMethods] = await Promise.all([
    db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(asc(paymentMethods.sortOrder)),
    db.select().from(shippingMethods).where(eq(shippingMethods.isActive, true)).orderBy(asc(shippingMethods.sortOrder)),
  ]);

  return (
    <CheckoutContent
      paymentMethods={activePaymentMethods.map((m) => ({ id: m.id, type: m.type as "bank_transfer" | "gateway", name: m.name, bankName: m.bankName, accountNumber: m.accountNumber, accountHolder: m.accountHolder, instructions: m.instructions }))}
      shippingMethods={activeShippingMethods.map((m) => ({ id: m.id, name: m.name, courier: m.courier, cost: Number(m.cost), estimatedDaysMin: m.estimatedDaysMin, estimatedDaysMax: m.estimatedDaysMax }))}
    />
  );
}

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getEmailProvider } from "./email-provider";

export type NotificationEvent =
  | "ORDER_CREATED"
  | "PAYMENT_RECEIVED"
  | "ORDER_CONFIRMED"
  | "DESIGN_SUBMITTED"
  | "DESIGN_REVISION_REQUESTED"
  | "DESIGN_APPROVED"
  | "PRODUCTION_STARTED"
  | "ORDER_READY"
  | "ORDER_SHIPPED"
  | "ORDER_COMPLETED"
  | "PASSWORD_RESET"
  | "MESSAGE_RECEIVED"
  | "ORDER_STATUS_CHANGED";

type NotifyInput = {
  userId?: string;
  orderId?: string;
  event: NotificationEvent;
  title: string;
  message: string;
  email?: { to: string; subject: string; html: string; text?: string };
};

/**
 * Centralized notification service.
 * Creates in-app notification + optionally sends email.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    // In-app notification
    if (input.userId) {
      await db.insert(notifications).values({
        userId: input.userId,
        orderId: input.orderId || null,
        type: input.event.toLowerCase(),
        title: input.title,
        message: input.message,
        channel: "in_app",
        status: "pending",
        sentAt: new Date(),
      });
    }

    // Email notification
    if (input.email) {
      const provider = getEmailProvider();
      await provider.send({
        to: input.email.to,
        subject: input.email.subject,
        html: input.email.html,
        text: input.email.text,
      });
    }
  } catch (error) {
    // Notification failure must never break the main operation
    console.error("[NOTIFICATION] Failed:", error);
  }
}

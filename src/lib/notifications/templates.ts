import { BRAND } from "@/lib/constants";

/**
 * Email templates for Madina Solution notifications.
 * Returns { subject, html, text } for each notification type.
 */

export function orderCreatedEmail(orderNumber: string, customerName: string, total: string) {
  return {
    subject: `Pesanan ${orderNumber} — ${BRAND.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#E8590C">Pesanan Berhasil Dibuat</h2>
      <p>Halo ${customerName},</p>
      <p>Pesanan Anda <strong>${orderNumber}</strong> telah berhasil dibuat dengan total <strong>${total}</strong>.</p>
      <p>Tim kami akan segera memproses pesanan Anda.</p>
      <p>Terima kasih,<br/>${BRAND.name}</p>
    </div>`,
    text: `Pesanan ${orderNumber} berhasil dibuat. Total: ${total}. Tim kami akan segera memproses.`,
  };
}

export function paymentReceivedEmail(orderNumber: string, customerName: string, amount: string) {
  return {
    subject: `Pembayaran Diterima — ${orderNumber}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16A34A">Pembayaran Diterima</h2>
      <p>Halo ${customerName},</p>
      <p>Pembayaran sebesar <strong>${amount}</strong> untuk pesanan <strong>${orderNumber}</strong> telah kami terima.</p>
      <p>Pesanan Anda akan segera diproses.</p>
      <p>Terima kasih,<br/>${BRAND.name}</p>
    </div>`,
    text: `Pembayaran ${amount} untuk pesanan ${orderNumber} telah diterima.`,
  };
}

export function designReadyEmail(orderNumber: string, customerName: string) {
  return {
    subject: `Desain Siap Direview — ${orderNumber}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#E8590C">Desain Siap Direview</h2>
      <p>Halo ${customerName},</p>
      <p>Desain untuk pesanan <strong>${orderNumber}</strong> sudah siap untuk Anda review.</p>
      <p>Silakan login ke akun Anda untuk melihat dan menyetujui desain.</p>
      <p>Terima kasih,<br/>${BRAND.name}</p>
    </div>`,
    text: `Desain untuk pesanan ${orderNumber} sudah siap direview. Login ke akun Anda.`,
  };
}

export function orderCompletedEmail(orderNumber: string, customerName: string) {
  return {
    subject: `Pesanan Selesai — ${orderNumber}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16A34A">Pesanan Selesai</h2>
      <p>Halo ${customerName},</p>
      <p>Pesanan <strong>${orderNumber}</strong> telah selesai.</p>
      <p>Terima kasih telah mempercayakan kebutuhan bisnis Anda kepada ${BRAND.name}!</p>
      <p>Salam,<br/>${BRAND.name}</p>
    </div>`,
    text: `Pesanan ${orderNumber} telah selesai. Terima kasih!`,
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: `Reset Password — ${BRAND.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#E8590C">Reset Password</h2>
      <p>Anda menerima email ini karena ada permintaan reset password.</p>
      <p><a href="${resetUrl}" style="background:#E8590C;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">Reset Password</a></p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      <p>${BRAND.name}</p>
    </div>`,
    text: `Reset password Anda: ${resetUrl}`,
  };
}

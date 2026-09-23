import { z } from "zod";

export const checkoutCustomerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(255),
  email: z.string().email("Format email tidak valid").max(255),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit").max(20),
  whatsapp: z.string().max(20).optional(),
});

export const checkoutAddressSchema = z.object({
  recipientName: z.string().min(2, "Nama penerima wajib diisi").max(255),
  phone: z.string().min(8, "Nomor telepon wajib diisi").max(20),
  address: z.string().min(5, "Alamat wajib diisi").max(500),
  city: z.string().min(2, "Kota wajib diisi").max(100),
  province: z.string().min(2, "Provinsi wajib diisi").max(100),
  district: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
});

export const checkoutItemSchema = z.object({
  productId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  selectedOptions: z.record(z.string(), z.string()),
  notes: z.string().max(1000).optional(),
}).refine((item) => Boolean(item.productId) !== Boolean(item.serviceId), { message: "Pesanan harus mengacu ke produk atau layanan." });

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  addressId: z.string().uuid().optional(),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  paymentMethodId: z.string().uuid("Metode pembayaran wajib dipilih"),
  shippingMethodId: z.string().uuid().optional(),
  items: z.array(checkoutItemSchema).min(1, "Keranjang tidak boleh kosong"),
  notes: z.string().max(2000).optional(),
  couponCode: z.string().max(50).optional(),
}).refine((data) => data.deliveryMethod !== "delivery" || Boolean(data.shippingMethodId), {
  message: "Metode pengiriman wajib dipilih",
  path: ["shippingMethodId"],
});

export type CheckoutData = z.infer<typeof checkoutSchema>;
export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

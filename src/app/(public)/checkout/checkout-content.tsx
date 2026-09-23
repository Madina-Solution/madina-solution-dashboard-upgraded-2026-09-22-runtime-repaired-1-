"use client";

import { SiteImage } from "@/components/ui/site-image";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Truck,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ImageOff,
  Landmark,
  CreditCard,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useCart } from "@/lib/cart/cart-provider";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { checkoutSchema, type CheckoutData } from "@/lib/validations/checkout";
import { MediaUploader } from "@/components/ui/media-uploader";

type CheckoutStep = "details" | "review" | "success";

type CheckoutPaymentMethod = { id: string; type: "bank_transfer" | "gateway"; name: string; bankName: string | null; accountNumber: string | null; accountHolder: string | null; instructions: string | null };
type CheckoutShippingMethod = { id: string; name: string; courier: string | null; cost: number; estimatedDaysMin: number | null; estimatedDaysMax: number | null };

type CheckoutContentProps = {
  paymentMethods: CheckoutPaymentMethod[];
  shippingMethods: CheckoutShippingMethod[];
};

export function CheckoutContent({ paymentMethods, shippingMethods }: CheckoutContentProps) {
  const router = useRouter();
  const { state: cart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = React.useState<CheckoutStep>("details");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderResult, setOrderResult] = React.useState<{
    orderId: string;
    orderNumber: string;
    total: number;
    paymentMethod: CheckoutPaymentMethod | null;
  } | null>(null);
  const [deliveryMethod, setDeliveryMethod] = React.useState<"delivery" | "pickup">("delivery");
  const [paymentMethodId, setPaymentMethodId] = React.useState<string>(paymentMethods[0]?.id || "");
  const [shippingMethodId, setShippingMethodId] = React.useState<string>(shippingMethods[0]?.id || "");
  const [proofUrl, setProofUrl] = React.useState("");
  const [isSavingProof, setIsSavingProof] = React.useState(false);
  const [proofSaved, setProofSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId) || null;
  const shippingCost = deliveryMethod === "pickup" ? 0 : selectedShipping?.cost || 0;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customer: { name: "", email: "", phone: "", whatsapp: "" },
      address: { recipientName: "", phone: "", address: "", city: "", province: "", district: "", postalCode: "" },
      addressId: "",
      deliveryMethod: "delivery" as const,
      items: [] as { productId?: string; serviceId?: string; quantity: number; selectedOptions: Record<string, string>; notes?: string }[],
      notes: "",
      couponCode: "",
    },
  });

  // Redirect to cart if empty
  const [savedAddresses, setSavedAddresses] = React.useState<Array<{ id: string; label: string | null; recipientName: string; phone: string; province: string; city: string; district: string | null; postalCode: string | null; address: string; isDefault: boolean | null }>>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>("");
  const autofillApplied = React.useRef(false);
  const [profileLoaded, setProfileLoaded] = React.useState(false);

  React.useEffect(() => {
    if (cart.items.length === 0 && step !== "success") {
      router.push("/cart");
    }
  }, [cart.items.length, step, router]);

  const applySavedAddress = React.useCallback((address: { id: string; recipientName: string; phone: string; address: string; city: string; province: string; district?: string | null; postalCode?: string | null }) => {
    setSelectedAddressId(address.id);
    setValue("addressId", address.id);
    setValue("address.recipientName", address.recipientName || "", { shouldValidate: true });
    setValue("address.phone", address.phone || "", { shouldValidate: true });
    setValue("address.address", address.address || "", { shouldValidate: true });
    setValue("address.city", address.city || "", { shouldValidate: true });
    setValue("address.province", address.province || "", { shouldValidate: true });
    setValue("address.district", address.district || "", { shouldValidate: false });
    setValue("address.postalCode", address.postalCode || "", { shouldValidate: false });
  }, [setValue]);

  const clearSavedAddressSelection = React.useCallback(() => {
    if (selectedAddressId) {
      setSelectedAddressId("");
      setValue("addressId", "");
    }
  }, [selectedAddressId, setValue]);
  const customerSnapshot = useWatch({ control, name: "customer" });

  React.useEffect(() => {
    if (!user || autofillApplied.current) return;
    autofillApplied.current = true;
    void (async () => {
      try {
        const [profileResponse, addressResponse] = await Promise.all([fetch("/api/account/profile"), fetch("/api/account/addresses")]);
        const profile = await profileResponse.json();
        const addressData = await addressResponse.json();
        if (profile?.success && profile.user) {
          setValue("customer.name", profile.user.name || "", { shouldValidate: true });
          setValue("customer.email", profile.user.email || "", { shouldValidate: true });
          setValue("customer.phone", profile.user.phone || "", { shouldValidate: true });
          setValue("customer.whatsapp", profile.user.phone || "", { shouldValidate: false });
        }
        if (addressData?.success && Array.isArray(addressData.addresses)) {
          setSavedAddresses(addressData.addresses);
          const preferred = addressData.addresses.find((a: { isDefault?: boolean }) => a.isDefault) || addressData.addresses[0];
          if (preferred) applySavedAddress(preferred);
        }
      } catch {
        // Inline fields remain available when account data cannot be loaded.
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, [user, setValue, applySavedAddress]);

  const onSubmit = async (formData: Record<string, unknown>) => {
    const fd = formData as unknown as CheckoutData;

    if (!paymentMethodId) {
      toast({ type: "error", title: "Pilih metode pembayaran terlebih dahulu" });
      return;
    }
    if (deliveryMethod === "delivery" && !shippingMethodId) {
      toast({ type: "error", title: "Pilih metode pengiriman terlebih dahulu" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer: fd.customer,
        address: fd.address,
        addressId: deliveryMethod === "delivery" ? selectedAddressId || undefined : undefined,
        deliveryMethod,
        paymentMethodId,
        shippingMethodId: deliveryMethod === "delivery" ? shippingMethodId : undefined,
        items: cart.items.map((item) => ({
          ...(item.itemType === "service" ? { serviceId: item.serviceId } : { productId: item.productId }),
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          notes: item.notes || undefined,
        })),
        notes: fd.notes,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast({
          type: "error",
          title: "Gagal membuat pesanan",
          description: result.error?.message || "Silakan coba lagi.",
        });
        return;
      }

      setOrderResult({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        total: result.order.total,
        paymentMethod: result.paymentMethod || null,
      });
      setStep("success");
      clearCart();
    } catch {
      toast({
        type: "error",
        title: "Terjadi kesalahan",
        description: "Koneksi gagal. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: "error", title: "Gagal menyalin nomor rekening" });
    }
  };

  const handleSaveProof = async () => {
    if (!orderResult || !proofUrl) return;
    setIsSavingProof(true);
    try {
      const res = await fetch(`/api/orders/${orderResult.orderId}/payment-proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setProofSaved(true);
        toast({ type: "success", title: "Bukti transfer tersimpan", description: "Tim kami akan segera memverifikasi pembayaran Anda." });
      } else {
        toast({ type: "error", title: data.error?.message || "Gagal menyimpan bukti transfer" });
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan" });
    } finally {
      setIsSavingProof(false);
    }
  };

  // Step: Success
  if (step === "success" && orderResult) {
    const pm = orderResult.paymentMethod;
    return (
      <div className="py-16 lg:py-24">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-dark">Pesanan Berhasil!</h1>
          <p className="mt-3 text-dark-600">
            Terima kasih. Pesanan Anda telah diterima dan sedang diproses.
          </p>
          <div className="mt-6 rounded-2xl border border-dark-100 bg-dark-50 p-6">
            <p className="text-sm text-dark-500">Nomor Pesanan</p>
            <p className="mt-1 text-2xl font-bold text-primary">{orderResult.orderNumber}</p>
            <p className="mt-4 text-sm text-dark-500">Total</p>
            <p className="mt-1 text-xl font-semibold text-dark">{formatCurrency(orderResult.total)}</p>
          </div>

          {pm && pm.type === "bank_transfer" && (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-left">
              <h2 className="flex items-center gap-2 font-semibold text-dark">
                <Landmark className="h-4 w-4 text-primary" /> Transfer ke {pm.name}
              </h2>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-dark-500">Bank</p>
                <p className="font-medium text-dark">{pm.bankName}</p>
                <p className="mt-2 text-dark-500">Nomor Rekening</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-lg font-bold text-dark">{pm.accountNumber}</p>
                  <button type="button" onClick={() => pm.accountNumber && handleCopyAccountNumber(pm.accountNumber)} className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-100 hover:text-primary" aria-label="Salin nomor rekening">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-dark-500">Atas Nama</p>
                <p className="font-medium text-dark">{pm.accountHolder}</p>
                {pm.instructions && <p className="mt-3 text-xs text-dark-500">{pm.instructions}</p>}
              </div>

              {user ? (
                <div className="mt-5 border-t border-dark-100 pt-4">
                  {proofSaved ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-green-600"><CheckCircle2 className="h-4 w-4" /> Bukti transfer sudah diunggah — menunggu verifikasi admin.</p>
                  ) : (
                    <>
                      <p className="mb-2 text-sm font-medium text-dark">Sudah transfer? Unggah bukti pembayaran</p>
                      <MediaUploader value={proofUrl} onChange={(v) => setProofUrl(Array.isArray(v) ? v[0] || "" : v)} purpose="customer_upload" label="" helpText="JPG/PNG screenshot bukti transfer" />
                      {proofUrl && (
                        <Button className="mt-3 w-full" onClick={handleSaveProof} isLoading={isSavingProof}>Simpan Bukti Transfer</Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-5 border-t border-dark-100 pt-4 text-sm text-dark-500">
                  Setelah transfer, kirimkan screenshot bukti pembayaran beserta nomor pesanan <strong>{orderResult.orderNumber}</strong> ke WhatsApp admin kami agar segera diverifikasi. Login ke akun Anda juga memungkinkan upload bukti langsung di sini.
                </p>
              )}
            </div>
          )}

          {pm && pm.type === "gateway" && (
            <p className="mt-6 text-sm text-dark-600">
              Tim kami akan menghubungi Anda melalui WhatsApp untuk menyelesaikan pembayaran otomatis.
            </p>
          )}

          <p className="mt-6 text-sm text-dark-500">
            Simpan nomor pesanan Anda. Tim kami akan segera menghubungi untuk konfirmasi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/products">Lanjut Belanja</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0 && step !== "success") {
    return null; // redirect is happening
  }

  // Step: Details + Review (single form)
  return (
    <div className="py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "/" },
            { label: "Keranjang", href: "/cart" },
            { label: "Checkout" },
          ]}
          className="mb-6"
        />

        <h1 className="text-3xl font-bold text-dark">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* LEFT — Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Customer */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-dark">
                    <User className="h-5 w-5 text-primary" />
                    Informasi Pelanggan
                  </h2>
                  {user && profileLoaded ? (
                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dark-400">Nama</p><p className="mt-1 text-sm font-semibold text-dark">{customerSnapshot?.name || "Belum diisi"}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dark-400">Email</p><p className="mt-1 text-sm font-semibold text-dark">{customerSnapshot?.email || "Belum diisi"}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dark-400">Telepon</p><p className="mt-1 text-sm font-semibold text-dark">{customerSnapshot?.phone || "Belum diisi"}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-dark-400">WhatsApp</p><p className="mt-1 text-sm font-semibold text-dark">{customerSnapshot?.whatsapp || customerSnapshot?.phone || "Sama dengan telepon"}</p></div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-3"><p className="text-xs text-dark-500">Checkout memakai data akun Anda. Perubahan profil berlaku ke transaksi berikutnya.</p><Link href="/account/profile" className="text-xs font-bold text-primary hover:underline">Kelola Profil</Link></div>
                      <input type="hidden" {...register("customer.name")} />
                      <input type="hidden" {...register("customer.email")} />
                      <input type="hidden" {...register("customer.phone")} />
                      <input type="hidden" {...register("customer.whatsapp")} />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div><label htmlFor="c-name" className="mb-1.5 block text-sm font-medium text-dark">Nama Lengkap *</label><Input id="c-name" placeholder="Nama lengkap" {...register("customer.name")} error={errors.customer?.name?.message} /></div>
                      <div><label htmlFor="c-email" className="mb-1.5 block text-sm font-medium text-dark">Email *</label><Input id="c-email" type="email" placeholder="nama@email.com" {...register("customer.email")} error={errors.customer?.email?.message} /></div>
                      <div><label htmlFor="c-phone" className="mb-1.5 block text-sm font-medium text-dark">Telepon *</label><Input id="c-phone" placeholder="08xx-xxxx-xxxx" {...register("customer.phone")} error={errors.customer?.phone?.message} /></div>
                      <div><label htmlFor="c-wa" className="mb-1.5 block text-sm font-medium text-dark">WhatsApp</label><Input id="c-wa" placeholder="Sama dengan telepon jika kosong" {...register("customer.whatsapp")} /></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-dark">
                    <Truck className="h-5 w-5 text-primary" />
                    Metode Pengiriman
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("delivery")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${deliveryMethod === "delivery" ? "border-primary bg-primary/5" : "border-dark-200 hover:border-dark-300"}`}
                    >
                      <Truck className="h-5 w-5 text-primary" />
                      <p className="mt-2 font-semibold text-dark">Pengiriman</p>
                      <p className="mt-1 text-sm text-dark-500">Dikirim ke alamat Anda</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("pickup")}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-dark-200 hover:border-dark-300"}`}
                    >
                      <MapPin className="h-5 w-5 text-primary" />
                      <p className="mt-2 font-semibold text-dark">Ambil Sendiri</p>
                      <p className="mt-1 text-sm text-dark-500">Ambil di lokasi Madina Solution</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              {deliveryMethod === "delivery" && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-dark">
                      <MapPin className="h-5 w-5 text-primary" />
                      Alamat Pengiriman
                    </h2>
                    {savedAddresses.length > 0 && (
                      <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
                        <label className="mb-1.5 block text-sm font-semibold text-dark">Gunakan alamat tersimpan</label>
                        <select
                          value={selectedAddressId}
                          onChange={(e) => {
                            const chosen = savedAddresses.find((a) => a.id === e.target.value);
                            if (chosen) applySavedAddress(chosen);
                            else { setSelectedAddressId(""); setValue("addressId", ""); }
                          }}
                          className="h-11 w-full rounded-xl border border-dark-200 bg-white px-3 text-sm text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Alamat baru / isi manual</option>
                          {savedAddresses.map((a) => <option key={a.id} value={a.id}>{a.label || "Alamat"} — {a.recipientName}, {a.city}</option>)}
                        </select>
                        <p className="mt-2 text-xs text-dark-500">Profil dan alamat utama diisikan otomatis. Saat Anda mengubah kolom alamat, sistem menganggapnya sebagai alamat khusus order ini.</p>
                      </div>
                    )}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="a-recip" className="mb-1.5 block text-sm font-medium text-dark">Nama Penerima *</label>
                        <Input id="a-recip" placeholder="Nama penerima" {...register("address.recipientName", { onChange: clearSavedAddressSelection })} error={errors.address?.recipientName?.message} />
                      </div>
                      <div>
                        <label htmlFor="a-phone" className="mb-1.5 block text-sm font-medium text-dark">Telepon Penerima *</label>
                        <Input id="a-phone" placeholder="08xx-xxxx-xxxx" {...register("address.phone", { onChange: clearSavedAddressSelection })} error={errors.address?.phone?.message} />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="a-addr" className="mb-1.5 block text-sm font-medium text-dark">Alamat Lengkap *</label>
                        <Input id="a-addr" placeholder="Jalan, RT/RW, nomor rumah" {...register("address.address", { onChange: clearSavedAddressSelection })} error={errors.address?.address?.message} />
                      </div>
                      <div>
                        <label htmlFor="a-dist" className="mb-1.5 block text-sm font-medium text-dark">Kecamatan</label>
                        <Input id="a-dist" placeholder="Kecamatan" {...register("address.district", { onChange: clearSavedAddressSelection })} />
                      </div>
                      <div>
                        <label htmlFor="a-city" className="mb-1.5 block text-sm font-medium text-dark">Kota/Kabupaten *</label>
                        <Input id="a-city" placeholder="Kota / Kabupaten" {...register("address.city", { onChange: clearSavedAddressSelection })} error={errors.address?.city?.message} />
                      </div>
                      <div>
                        <label htmlFor="a-prov" className="mb-1.5 block text-sm font-medium text-dark">Provinsi *</label>
                        <Input id="a-prov" placeholder="Provinsi" {...register("address.province", { onChange: clearSavedAddressSelection })} error={errors.address?.province?.message} />
                      </div>
                      <div>
                        <label htmlFor="a-post" className="mb-1.5 block text-sm font-medium text-dark">Kode Pos</label>
                        <Input id="a-post" placeholder="Kode pos" {...register("address.postalCode", { onChange: clearSavedAddressSelection })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Courier */}
              {deliveryMethod === "delivery" && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-dark">
                      <Truck className="h-5 w-5 text-primary" />
                      Pilih Kurir
                    </h2>
                    {shippingMethods.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {shippingMethods.map((m) => (
                          <label key={m.id} className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${shippingMethodId === m.id ? "border-primary bg-primary/5" : "border-dark-200 hover:border-dark-300"}`}>
                            <div className="flex items-center gap-3">
                              <input type="radio" name="shippingMethod" checked={shippingMethodId === m.id} onChange={() => setShippingMethodId(m.id)} className="h-4 w-4 text-primary" />
                              <div>
                                <p className="font-medium text-dark">{m.name}</p>
                                <p className="text-xs text-dark-500">{m.courier ? `${m.courier} · ` : ""}est. {m.estimatedDaysMin}-{m.estimatedDaysMax} hari</p>
                              </div>
                            </div>
                            <span className="font-semibold text-dark">{formatCurrency(m.cost)}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 flex items-center gap-2 text-sm text-amber-600"><AlertCircle className="h-4 w-4" /> Belum ada kurir aktif. Hubungi admin sebelum melanjutkan.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-dark">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Metode Pembayaran
                  </h2>
                  {paymentMethods.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {paymentMethods.map((m) => (
                        <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${paymentMethodId === m.id ? "border-primary bg-primary/5" : "border-dark-200 hover:border-dark-300"}`}>
                          <input type="radio" name="paymentMethod" checked={paymentMethodId === m.id} onChange={() => setPaymentMethodId(m.id)} className="mt-0.5 h-4 w-4 text-primary" />
                          <div className="flex items-center gap-2">
                            {m.type === "bank_transfer" ? <Landmark className="h-4 w-4 text-dark-400" /> : <CreditCard className="h-4 w-4 text-dark-400" />}
                            <div>
                              <p className="font-medium text-dark">{m.name}</p>
                              {m.type === "bank_transfer" && <p className="text-xs text-dark-500">{m.bankName} a.n. {m.accountHolder || "-"}</p>}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-sm text-amber-600"><AlertCircle className="h-4 w-4" /> Belum ada metode pembayaran aktif. Hubungi admin sebelum melanjutkan.</p>
                  )}
                </CardContent>
              </Card>

              {/* Coupon */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-dark">Kupon Diskon</h2>
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Masukkan kode kupon"
                      {...register("couponCode")}
                      className="flex-1 uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const code = (document.querySelector('input[name="couponCode"]') as HTMLInputElement)?.value;
                        if (!code) return;
                        try {
                          const res = await fetch("/api/cart/coupon", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ code, subtotal: cart.estimatedTotal }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            toast({ type: "success", title: `Kupon ${data.coupon.code} berlaku!`, description: `Diskon: Rp ${data.coupon.discount.toLocaleString("id-ID")}` });
                          } else {
                            toast({ type: "error", title: data.error?.message || "Kupon tidak valid" });
                          }
                        } catch {
                          toast({ type: "error", title: "Gagal validasi kupon" });
                        }
                      }}
                    >
                      Terapkan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-dark">Catatan Pesanan</h2>
                  <textarea
                    placeholder="Catatan tambahan untuk pesanan ini (opsional)"
                    rows={3}
                    className="mt-4 w-full rounded-xl border border-dark-200 px-4 py-3 text-sm placeholder:text-dark-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...register("notes")}
                  />
                </CardContent>
              </Card>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-dark">Ringkasan Pesanan</h2>

                  {/* Items */}
                  <div className="mt-4 space-y-3">
                    {cart.items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-3 border-b border-dark-100 pb-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-dark-50">{item.productThumbnail ? <SiteImage src={item.productThumbnail} alt={item.productName} fill sizes="48px" className="object-cover" /> : <div className="grid h-full place-items-center text-dark-300"><ImageOff className="h-5 w-5" aria-hidden="true" /></div>}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-dark">{item.productName}</p>
                          <p className="text-xs text-dark-500 line-clamp-1">{item.optionsSummary}</p>
                          <p className="text-xs text-dark-500">
                            {item.quantity} {item.unit} × {formatCurrency(item.estimatedUnitPrice)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-dark">
                          {formatCurrency(item.estimatedSubtotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 space-y-2 border-b border-dark-100 pb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-600">Subtotal</span>
                      <span className="font-medium text-dark">{formatCurrency(cart.estimatedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-600">Pengiriman</span>
                      <span className="text-dark-500">{deliveryMethod === "pickup" ? "Gratis" : selectedShipping ? formatCurrency(shippingCost) : "Pilih kurir"}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <span className="font-semibold text-dark">Estimasi Total</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(cart.estimatedTotal + shippingCost)}</span>
                  </div>

                  <p className="mt-2 text-xs text-dark-400">
                    Harga final dihitung ulang oleh server.
                  </p>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-6 w-full"
                    disabled={isSubmitting || !paymentMethodId || (deliveryMethod === "delivery" && !shippingMethodId)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        Buat Pesanan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="mt-2 w-full" asChild>
                    <Link href="/cart">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali ke Keranjang
                    </Link>
                  </Button>

                  {/* Trust */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-dark-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                      Garansi kualitas cetak
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark-500">
                      <Clock className="h-3.5 w-3.5 text-orange-600" />
                      Konfirmasi dalam 24 jam
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { SocialAuthButtons } from "@/components/auth-social-buttons";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui syarat & ketentuan",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { register: registerAuth } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await registerAuth({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      if (result.success) {
        toast({ type: "success", title: "Akun berhasil dibuat", description: "Selamat bergabung!" });
        router.push("/account");
      } else {
        setServerError(result.error || "Gagal mendaftar");
      }
    } catch {
      setServerError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SocialAuthButtons mode="register" />
      <div className="my-6 flex items-center gap-3 text-xs text-dark-400"><div className="h-px flex-1 bg-dark-200" /><span>atau daftar dengan email</span><div className="h-px flex-1 bg-dark-200" /></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-dark">Nama Lengkap</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="name" placeholder="Nama lengkap Anda" autoComplete="name" className="pl-10" {...register("name")} aria-invalid={!!errors.name} />
        </div>
        {errors.name && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-dark">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="reg-email" type="email" placeholder="nama@email.com" autoComplete="email" className="pl-10" {...register("email")} aria-invalid={!!errors.email} />
        </div>
        {errors.email && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-medium text-dark">Telepon <span className="text-dark-400">(opsional)</span></label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="reg-phone" placeholder="08xx-xxxx-xxxx" autoComplete="tel" className="pl-10" {...register("phone")} />
        </div>
      </div>

      <div>
        <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-dark">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Minimal 6 karakter" autoComplete="new-password" className="pl-10 pr-10" {...register("password")} aria-invalid={!!errors.password} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark" aria-label="Toggle password">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        {errors.password && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-dark">Konfirmasi Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Ulangi password" autoComplete="new-password" className="pl-10" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword} />
        </div>
        {errors.confirmPassword && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.confirmPassword.message}</p>}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary focus:ring-2 focus:ring-primary/20" {...register("acceptTerms")} />
        <span className="text-sm text-dark-600">
          Saya menyetujui <Link href="/terms" className="text-primary hover:underline">Syarat & Ketentuan</Link> dan <Link href="/privacy" className="text-primary hover:underline">Kebijakan Privasi</Link>
        </span>
      </label>
      {errors.acceptTerms && <p className="flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.acceptTerms.message}</p>}

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        Buat Akun
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      </form>
    </>
  );
}

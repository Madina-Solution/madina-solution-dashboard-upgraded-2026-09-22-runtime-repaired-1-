"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/auth-provider";
import { SocialAuthButtons } from "@/components/auth-social-buttons";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({ type: "success", title: "Berhasil masuk", description: "Selamat datang kembali!" });
        router.push("/account");
      } else {
        setServerError(result.error || "Email atau password salah");
      }
    } catch {
      setServerError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SocialAuthButtons />
      <div className="my-6 flex items-center gap-3 text-xs text-dark-400"><div className="h-px flex-1 bg-dark-200" /><span>atau masuk dengan email</span><div className="h-px flex-1 bg-dark-200" /></div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-dark">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="email" type="email" placeholder="nama@email.com" autoComplete="email" className="pl-10" {...register("email")} aria-invalid={!!errors.email} />
        </div>
        {errors.email && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.email.message}</p>}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-dark">Password</label>
          <Link href="/forgot-password" className="text-sm text-primary transition-colors hover:text-primary-dark">Lupa password?</Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-dark-400" />
          <Input id="password" type={showPassword ? "text" : "password"} placeholder="Masukkan password" autoComplete="current-password" className="pl-10 pr-10" {...register("password")} aria-invalid={!!errors.password} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 transition-colors hover:text-dark" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500"><AlertCircle className="h-3.5 w-3.5" />{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        Masuk
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      </form>
    </>
  );
}

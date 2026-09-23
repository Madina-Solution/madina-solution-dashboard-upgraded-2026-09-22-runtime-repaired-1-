"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ password: z.string().min(8, "Password minimal 8 karakter").max(128), confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Password tidak sama" });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const submit = async (data: FormData) => {
    setLoading(true); setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: data.password }) });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || "Reset password gagal");
      setSuccess(true);
    } catch (e) { setServerError(e instanceof Error ? e.message : "Reset password gagal"); }
    finally { setLoading(false); }
  };

  if (success) return <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-green-600"/><h3 className="mt-3 font-semibold">Password berhasil diubah</h3><p className="mt-2 text-sm text-dark-600">Silakan masuk dengan password baru Anda.</p></div>;
  if (!token) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto h-8 w-8 text-red-600"/><p className="mt-2 text-sm text-red-700">Token reset tidak valid atau tidak ditemukan.</p></div>;

  return <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
    <div><label htmlFor="password" className="mb-1.5 block text-sm font-medium text-dark">Password baru</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"/><Input id="password" type="password" autoComplete="new-password" className="pl-10" {...register("password")} aria-invalid={!!errors.password}/></div>{errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}</div>
    <div><label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-dark">Konfirmasi password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"/><Input id="confirmPassword" type="password" autoComplete="new-password" className="pl-10" {...register("confirmPassword")} aria-invalid={!!errors.confirmPassword}/></div>{errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword.message}</p>}</div>
    {serverError && <p className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4"/>{serverError}</p>}
    <Button type="submit" size="lg" className="w-full" isLoading={loading}>Simpan Password<ArrowRight className="ml-2 h-4 w-4"/></Button>
  </form>;
}

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open, title, description, confirmLabel = "Konfirmasi", cancelLabel = "Batal",
  variant = "default", isLoading = false, onConfirm, onCancel,
}: Props) {
  React.useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-dark/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-premium-lg dark:bg-slate-900 dark:ring-1 dark:ring-slate-800" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant === "danger" ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300" : variant === "warning" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-300" : "bg-primary/10 text-primary"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 id="confirm-title" className="font-semibold text-dark dark:text-white">{title}</h3>
                {description && <p className="mt-1 text-sm text-dark-500 dark:text-slate-400">{description}</p>}
              </div>
              <button onClick={onCancel} className="rounded-lg p-1 text-dark-400 hover:bg-dark-100 dark:text-slate-500 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>{cancelLabel}</Button>
              <Button variant={variant === "danger" ? "destructive" : "default"} onClick={onConfirm} isLoading={isLoading}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

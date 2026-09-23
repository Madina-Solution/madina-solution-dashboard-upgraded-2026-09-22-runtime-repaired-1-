"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: "left" | "right" | "bottom";
  className?: string;
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
  className,
}: Props) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const sideClasses = {
    left: "inset-y-0 left-0 w-full max-w-sm",
    right: "inset-y-0 right-0 w-full max-w-sm",
    bottom: "inset-x-0 bottom-0 max-h-[90vh]",
  };

  const initialClasses = {
    left: { x: "-100%" },
    right: { x: "100%" },
    bottom: { y: "100%" },
  };

  const animateClasses = {
    left: { x: 0 },
    right: { x: 0 },
    bottom: { y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "drawer-title" : undefined}
            initial={initialClasses[side]}
            animate={animateClasses[side]}
            exit={initialClasses[side]}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "absolute bg-white shadow-premium-lg flex flex-col scrollbar-hide",
              sideClasses[side],
              side === "bottom" && "rounded-t-3xl",
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between border-b border-dark-100 p-6">
                <div>
                  {title && (
                    <h2
                      id="drawer-title"
                      className="text-lg font-semibold text-dark"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-dark-500">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1 text-dark-500 transition-colors hover:bg-dark-100 hover:text-dark"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

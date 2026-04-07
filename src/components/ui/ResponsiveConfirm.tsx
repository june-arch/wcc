"use client";
// src/components/ui/ResponsiveConfirm.tsx
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ResponsiveConfirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  variant = "danger",
}: ResponsiveConfirmProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-50 text-red-600 border-red-200",
    warning: "bg-amber-50 text-amber-600 border-amber-200",
    info: "bg-blue-50 text-blue-600 border-blue-200",
  };

  const buttonStyles = {
    danger: "btn btn-danger",
    warning: "btn btn-primary bg-amber-600 hover:bg-amber-700",
    info: "btn btn-primary",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Mobile: Drawer from bottom, Desktop: Modal */}
      <div
        className={cn(
          "bg-white w-full overflow-hidden animate-slide-up",
          "fixed inset-x-0 bottom-0 sm:static sm:inset-auto rounded-t-2xl sm:rounded-2xl",
          "sm:max-w-md sm:max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", variantStyles[variant])}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-stone-600 text-sm leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1 order-2 sm:order-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={cn("flex-1 justify-center order-1 sm:order-2", buttonStyles[variant])}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

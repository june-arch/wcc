"use client";
// src/components/ui/ResponsiveConfirm.tsx - Drawer Style
import { AlertTriangle, ArrowLeft } from "lucide-react";
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
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors -ml-2"
        >
          <ArrowLeft size={20} className="text-stone-600" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", variantStyles[variant])}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-base">{title}</h2>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-stone-600 text-sm leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onConfirm}
            className={cn("w-full justify-center", buttonStyles[variant])}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary w-full"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

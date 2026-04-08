"use client";
// src/components/ui/ResponsiveModal.tsx - Always Drawer Style
import { ArrowLeft } from "lucide-react";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: ResponsiveModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white"
    >
      {/* Header - Drawer Style */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 sticky top-0 bg-white z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors -ml-2"
        >
          <ArrowLeft size={20} className="text-stone-600" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-stone-900 text-base truncate">{title}</h2>
          {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="h-[calc(100vh-60px)] overflow-y-auto p-4 pb-32">
        {children}
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[60] bg-white flex flex-col" style={{ height: '100dvh' }}>
      {/* Header - Drawer Style */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 shrink-0 bg-white z-10">
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

      {/* Content - Scrollable with safe area support */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain p-4" 
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 20px) + 80px)' }}
      >
        {children}
      </div>
    </div>
  );
}

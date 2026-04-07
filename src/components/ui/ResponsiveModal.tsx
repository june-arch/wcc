"use client";
// src/components/ui/ResponsiveModal.tsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Mobile: Full screen drawer from bottom */}
      <div
        className={cn(
          "bg-white w-full overflow-y-auto animate-slide-up",
          // Mobile: full screen drawer
          "fixed inset-x-0 bottom-0 top-0 sm:static sm:inset-auto rounded-t-2xl sm:rounded-2xl",
          // Desktop: modal style
          `sm:${maxWidth} sm:max-h-[90vh]`
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 sticky top-0 bg-white z-10 rounded-t-2xl sm:rounded-t-2xl">
          <div className="min-w-0">
            <h2 className="font-bold text-stone-900 text-base sm:text-lg truncate">{title}</h2>
            {subtitle && <p className="text-xs text-stone-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {/* Mobile handle bar */}
          <div className="flex items-center gap-2">
            <div className="sm:hidden w-8 h-1 bg-stone-200 rounded-full" />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X size={20} className="text-stone-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 pb-safe">{children}</div>
      </div>
    </div>
  );
}

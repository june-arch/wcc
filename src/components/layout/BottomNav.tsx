"use client";
// src/components/layout/BottomNav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  Database,
  Settings,
} from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Booking", icon: CalendarDays },
  { href: "/dashboard/finance", label: "Keuangan", icon: Wallet },
  { href: "/dashboard/price-list", label: "Master Data", icon: Database },
  { href: "/dashboard/settings", label: "Setting", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNavigation = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50 safe-area-pb">
      {/* Loading indicator */}
      {isPending && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-100 overflow-hidden">
          <div 
            className="h-full w-1/2 bg-orange-500"
            style={{
              animation: 'loading 1s ease-in-out infinite',
            }} 
          />
        </div>
      )}
      
      <div className="flex items-center justify-around h-[60px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard"
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0",
                "transition-all duration-300 ease-out",
                "active:scale-95",
                isPending && "opacity-50 cursor-wait",
                isActive
                  ? "text-orange-600"
                  : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "transition-all duration-300",
                  isActive && "scale-110"
                )}
              />
              <span className={cn(
                "text-[10px] font-medium truncate w-full text-center px-1",
                "transition-all duration-300",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </nav>
  );
}

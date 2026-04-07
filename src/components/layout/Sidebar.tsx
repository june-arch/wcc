"use client";
// src/components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Camera,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Booking", icon: CalendarDays },
  { href: "/dashboard/finance", label: "Keuangan", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden flex-col bg-white border-r border-stone-200 shrink-0"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-200">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
        >
          <Camera size={16} color="white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-stone-900 leading-tight tracking-tight">WCC Oranye</p>
          <p className="text-[11px] text-stone-400 leading-tight">Wedding Capture</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-link", isActive && "active")}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-200">
        <p className="text-[11px] text-stone-400 text-center">v1.0.0 · 2026</p>
      </div>
    </aside>
  );
}

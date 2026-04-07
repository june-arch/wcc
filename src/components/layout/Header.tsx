"use client";
// src/components/layout/Header.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { LogOut, User, ChevronDown, Bell } from "lucide-react";
import toast from "react-hot-toast";

interface HeaderProps {
  user: { name: string; email: string; image?: string | null };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  };

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className="bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0"
      style={{ height: "var(--header-h)" }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile brand */}
        <div className="flex items-center gap-2 md:hidden">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          >
            <span className="text-white text-xs font-bold">W</span>
          </div>
          <span className="font-semibold text-stone-900 text-sm">WCC Oranye</span>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell placeholder */}
        <button className="btn btn-ghost w-9 h-9 p-0 justify-center relative">
          <Bell size={16} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                 style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-stone-900 leading-tight">{user.name}</p>
              <p className="text-xs text-stone-400 leading-tight">{user.email}</p>
            </div>
            <ChevronDown size={14} className="text-stone-400 hidden sm:block" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 card shadow-lg shadow-stone-200/80 z-20 py-1 animate-slide-up">
                <div className="px-3 py-2 border-b border-stone-100">
                  <p className="text-sm font-medium text-stone-900">{user.name}</p>
                  <p className="text-xs text-stone-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

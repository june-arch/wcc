"use client";
// src/components/layout/Header.tsx
import Image from "next/image";
import type { User } from "better-auth/types";

interface Props {
  user?: User;
}

export default function Header({ user }: Props) {
  return (
    <header
      className="bg-white border-b border-stone-200 flex items-center px-6 shrink-0"
      style={{ height: "var(--header-h)" }}
    >
      <div className="flex items-center gap-4 w-full">
        <Image
          src="/logo.webp"
          alt="WCC"
          width={140}
          height={56}
          className="w-auto h-12 object-contain shrink-0"
        />
        <div className="flex flex-col">
          <span className="font-bold text-stone-900 text-base">WCC Oranye Capture</span>
          <span className="text-xs text-stone-500">Wedding Management System</span>
        </div>
      </div>
    </header>
  );
}

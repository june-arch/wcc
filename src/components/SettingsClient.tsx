"use client";
// src/components/SettingsClient.tsx
import { useState } from "react";
import { User, Lock, Bell, Info, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
  user: { id: string; name: string; email: string; image?: string | null };
}

export default function SettingsClient({ user }: Props) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      // Could call PATCH /api/user in a real app
      await new Promise((r) => setTimeout(r, 500));
      toast.success("Profil diperbarui");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900">Pengaturan</h1>
        <p className="text-stone-500 text-sm mt-0.5">Kelola akun dan preferensi</p>
      </div>

      {/* Profile section */}
      <div className="card p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <User size={16} className="text-stone-400" />
          <h2 className="font-semibold text-stone-800 text-sm">Profil</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}
          >
            {user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{user.name}</p>
            <p className="text-sm text-stone-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nama Tampilan</label>
            <input
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
            <input className="input-base bg-stone-50 text-stone-400 cursor-not-allowed" value={user.email} readOnly />
            <p className="text-xs text-stone-400 mt-1">Email tidak bisa diubah</p>
          </div>
        </div>

        <button
          onClick={handleSaveName}
          disabled={saving || name === user.name}
          className="btn btn-primary text-sm"
        >
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {/* App info */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
          <Info size={16} className="text-stone-400" />
          <h2 className="font-semibold text-stone-800 text-sm">Tentang Aplikasi</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ["Nama Aplikasi", "WCC Oranye Capture"],
            ["Versi", "1.0.0"],
            ["Framework", "Next.js 15 + TypeScript"],
            ["Database", "Neon PostgreSQL (Prisma ORM)"],
            ["Auth", "BetterAuth"],
            ["Hosting", "Vercel"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-stone-400">{label}</span>
              <span className="font-medium text-stone-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-4 sm:p-6 border border-red-100 bg-red-50/30">
        <h2 className="font-semibold text-red-700 text-sm mb-3">Zona Bahaya</h2>
        <p className="text-xs text-red-500 mb-4">
          Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
        </p>
        <button className="btn btn-danger text-xs px-4 w-full sm:w-auto">Hapus Semua Data Booking</button>
      </div>
    </div>
  );
}

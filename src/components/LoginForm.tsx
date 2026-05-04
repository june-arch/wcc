"use client";
// src/components/LoginForm.tsx
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.email({
        email: form.email,
        password: form.password,
      });
      if (error) throw new Error(error.message);
      toast.success("Selamat datang kembali!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">Masuk ke akun</h2>
        <p className="text-sm text-stone-500 mt-0.5">Masukkan email dan password Anda</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
        <input
          className="input-base"
          type="email"
          placeholder="nama@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
        <div className="relative">
          <input
            className="input-base pr-10"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full justify-center py-2.5 text-sm"
        style={{ background: loading ? "#d97706" : "var(--brand)" }}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Memproses...</>
        ) : (
          "Masuk"
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-stone-400">atau</span>
        </div>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:4000"}/login?redirect=${typeof window !== "undefined" ? window.location.href : ""}`}
        className="btn w-full justify-center py-2.5 text-sm border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:text-stone-900"
      >
        <KeyRound size={16} />
        Masuk dengan Portal SSO
      </a>
    </form>
  );
}

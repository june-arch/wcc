"use client";
// src/components/LoginForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn.email({
          email: form.email,
          password: form.password,
        });
        if (error) throw new Error(error.message);
        toast.success("Selamat datang kembali!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await signUp.email({
          email: form.email,
          password: form.password,
          name: form.name,
        });
        if (error) throw new Error(error.message);
        toast.success("Akun berhasil dibuat!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">
          {mode === "login" ? "Masuk ke akun" : "Buat akun baru"}
        </h2>
        <p className="text-sm text-stone-500 mt-0.5">
          {mode === "login"
            ? "Masukkan email dan password Anda"
            : "Lengkapi data untuk mendaftar"}
        </p>
      </div>

      {mode === "register" && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Nama Lengkap</label>
          <input
            className="input-base"
            type="text"
            placeholder="Nama Anda"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
      )}

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
        ) : mode === "login" ? (
          "Masuk"
        ) : (
          "Daftar"
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-stone-400">atau</span>
        </div>
      </div>

      <p className="text-center text-sm text-stone-500">
        {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="font-medium text-orange-600 hover:text-orange-700 underline underline-offset-2"
        >
          {mode === "login" ? "Daftar sekarang" : "Masuk"}
        </button>
      </p>
    </form>
  );
}

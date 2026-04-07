// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-100 opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md animate-slide-up px-4 sm:px-0">
        {/* Logo / Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <Image
            src="/logo.webp"
            alt="WCC Oranye Capture Logo"
            width={200}
            height={80}
            className="w-auto h-16 sm:h-20 mx-auto mb-3 sm:mb-4 object-contain drop-shadow-lg"
            priority
          />
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">WCC Oranye Capture</h1>
          <p className="text-stone-500 text-sm mt-1">Wedding Management System</p>
        </div>

        {/* Form card */}
        <div className="card p-6 sm:p-8 shadow-xl shadow-stone-200/60">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-stone-400 mt-5 sm:mt-6">
          © 2026 WCC Oranye Capture. All rights reserved.
        </p>
      </div>
    </div>
  );
}

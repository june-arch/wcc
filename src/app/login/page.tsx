// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 shadow-lg mb-4"
               style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">WCC Oranye Capture</h1>
          <p className="text-stone-500 text-sm mt-1">Wedding Management System</p>
        </div>

        {/* Form card */}
        <div className="card p-8 shadow-xl shadow-stone-200/60">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          © 2026 WCC Oranye Capture. All rights reserved.
        </p>
      </div>
    </div>
  );
}

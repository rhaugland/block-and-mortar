"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"business" | "property">(
    roleParam === "property" ? "property" : "business"
  );
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-peach-soft via-sunflower-soft/40 to-surface px-4 py-12">
      <div className="absolute -left-4 top-20 h-24 w-24 rounded-full bg-coral/10 blur-2xl" />
      <div className="absolute -right-8 top-40 h-32 w-32 rounded-full bg-sunflower/15 blur-2xl" />

      <div className="w-full max-w-[420px] rounded-3xl border border-glass-border bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Logo />
        </div>

        {sent ? (
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
              Check your email
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">
              If an account exists for <span className="font-medium text-text-primary">{email}</span>, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              href={role === "property" ? "/property/login" : "/business/login"}
              className="mt-6 inline-block text-[13px] font-medium text-coral hover:text-peach"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
              Reset your password
            </h1>
            <p className="mt-1.5 text-[15px] text-text-secondary">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("business")}
                  className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${role === "business" ? "bg-coral text-white shadow-sm" : "border border-glass-border bg-white/60 text-text-secondary hover:bg-white"}`}
                >
                  Business
                </button>
                <button
                  type="button"
                  onClick={() => setRole("property")}
                  className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${role === "property" ? "bg-coral text-white shadow-sm" : "border border-glass-border bg-white/60 text-text-secondary hover:bg-white"}`}
                >
                  Property
                </button>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface"><div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

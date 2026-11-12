"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reset failed");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <div className="text-center">
          <p className="text-[15px] text-text-secondary">Invalid reset link.</p>
          <Link href="/forgot-password" className="mt-2 inline-block text-[13px] font-medium text-coral hover:text-peach">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-peach-soft via-sunflower-soft/40 to-surface px-4 py-12">
      <div className="absolute -left-4 top-20 h-24 w-24 rounded-full bg-coral/10 blur-2xl" />
      <div className="absolute -right-8 top-40 h-32 w-32 rounded-full bg-sunflower/15 blur-2xl" />

      <div className="w-full max-w-[420px] rounded-3xl border border-glass-border bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        <div className="mb-8">
          <Logo size="large" />
        </div>

        {success ? (
          <div>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
              Password reset!
            </h1>
            <p className="mt-2 text-[15px] text-text-secondary">
              Your password has been updated. You can now sign in.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/business/login" className="rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Business sign in
              </Link>
              <Link href="/property/login" className="rounded-xl border border-glass-border bg-white/60 px-5 py-2.5 text-[13px] font-medium text-text-primary transition-all hover:bg-white hover:shadow-sm active:scale-[0.98]">
                Property sign in
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
              Set a new password
            </h1>
            <p className="mt-1.5 text-[15px] text-text-secondary">
              Must be at least 8 characters.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">New password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Confirm password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface"><div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

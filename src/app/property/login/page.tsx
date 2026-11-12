"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function PropertyLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/property/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push("/property/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
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

        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
          Property sign-in
        </h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">
          Check your widget stats and manage your embed.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email</label>
            <input name="email" type="email" required className="w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
            <input name="password" type="password" required className="w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-tertiary">
          New here?{" "}
          <Link href="/property/signup" className="font-medium text-coral hover:text-peach">
            Register your property
          </Link>
        </p>
      </div>
    </div>
  );
}

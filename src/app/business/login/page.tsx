"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function BusinessLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/business/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      router.push("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="mb-10">
        <Logo size="large" />
      </div>
      <div className="w-full max-w-[380px]">
        <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-[15px] text-text-secondary">
          Sign in to manage your offers and track performance.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-text-primary py-3 text-[15px] font-medium text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-tertiary">
          New here?{" "}
          <Link href="/business/signup" className="font-medium text-accent hover:text-accent-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const CATEGORIES = [
  "Restaurant", "Cafe", "Gym / Fitness", "Salon / Spa",
  "Retail", "Services", "Entertainment", "Other",
];

export default function BusinessSignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"), category: fd.get("category"),
      address: fd.get("address"), city: fd.get("city"),
      state: fd.get("state"), zip: fd.get("zip"),
      contactName: fd.get("contactName"), email: fd.get("email"),
      password: fd.get("password"), phone: fd.get("phone") || undefined,
      websiteUrl: fd.get("websiteUrl") || undefined,
    };

    try {
      const res = await fetch("/api/business/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }
      router.push("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const label = "block text-[13px] font-medium text-text-secondary mb-1.5";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-peach-soft via-sunflower-soft/40 to-surface px-4 py-12">
      {/* Decorative blurs */}
      <div className="absolute -left-4 top-20 h-24 w-24 rounded-full bg-coral/10 blur-2xl" />
      <div className="absolute -right-8 top-40 h-32 w-32 rounded-full bg-sunflower/15 blur-2xl" />

      <div className="w-full max-w-[520px] rounded-3xl border border-glass-border bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        {/* Back arrow + Logo */}
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
          Get in front of new neighbors
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-text-secondary">
          Create offers that appear on apartment websites near you. You only pay when a renter clicks.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Business name</label>
              <input name="name" required className={input} />
            </div>
            <div>
              <label className={label}>Category</label>
              <select name="category" required className={input}>
                <option value="">Select</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Street address</label>
            <input name="address" required className={input} />
          </div>

          <div className="grid grid-cols-[1fr_80px_100px] gap-3">
            <div>
              <label className={label}>City</label>
              <input name="city" required className={input} />
            </div>
            <div>
              <label className={label}>State</label>
              <select name="state" required className={input}>
                <option value="">--</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>ZIP</label>
              <input name="zip" required className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Your name</label>
              <input name="contactName" required className={input} />
            </div>
            <div>
              <label className={label}>Phone <span className="text-text-tertiary">(optional)</span></label>
              <input name="phone" type="tel" className={input} />
            </div>
          </div>

          <div>
            <label className={label}>Email</label>
            <input name="email" type="email" required className={input} />
          </div>

          <div>
            <label className={label}>Password <span className="text-text-tertiary">(8+ characters)</span></label>
            <input name="password" type="password" required minLength={8} className={input} />
          </div>

          <div>
            <label className={label}>Website <span className="text-text-tertiary">(optional)</span></label>
            <input name="websiteUrl" type="url" placeholder="https://" className={input} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-tertiary">
          Already have an account?{" "}
          <Link href="/business/login" className="font-medium text-coral hover:text-peach">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

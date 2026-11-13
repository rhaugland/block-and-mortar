"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

const DURATIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function NewOffer() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  const [budget, setBudget] = useState("25");

  const clicks = budget ? Math.floor(parseFloat(budget) / 0.5) : 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title"),
      description: fd.get("title"),
      imageUrl: fd.get("imageUrl") || undefined,
      radiusMiles: parseFloat(fd.get("radiusMiles") as string) || 3,
      budgetCents: Math.round(parseFloat(budget) * 100) || 2500,
      cpcCents: 50,
      durationDays: duration,
    };

    try {
      const res = await fetch("/api/business/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create offer");
      }
      router.push("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral";
  const label = "block text-[12px] font-medium text-text-secondary mb-1.5";

  return (
    <div className="relative flex min-h-[calc(100vh-65px)] items-start justify-center px-4 py-10">
      <div className="w-full max-w-[520px] rounded-3xl border border-glass-border bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
        {/* Back + Logo */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/business/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Logo />
        </div>

        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
          Create an offer
        </h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">
          This will appear on apartment websites near your business.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {/* Headline */}
          <div>
            <label className={label}>Headline</label>
            <input name="title" required placeholder="e.g. 20% off your first visit" className={input} />
          </div>

          {/* Duration */}
          <div>
            <label className={label}>How long should this run?</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 rounded-lg py-2.5 text-[13px] font-medium transition-all ${
                    duration === d.value
                      ? "bg-coral text-white shadow-sm"
                      : "border border-glass-border bg-white/60 text-text-secondary hover:bg-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className={label}>Image or logo <span className="text-text-tertiary">(optional)</span></label>
            <input name="imageUrl" type="url" placeholder="https://..." className={input} />
          </div>

          {/* Budget & Radius */}
          <div className="rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 p-5">
            <p className="text-[14px] font-semibold text-text-primary">Targeting &amp; budget</p>
            <p className="mt-0.5 text-[12px] text-text-tertiary">
              All clicks are $0.50. Set a budget and your offer pauses when it&apos;s spent.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Radius (miles)</label>
                <input name="radiusMiles" type="number" step="0.5" defaultValue="3" min="0.5" max="25" className={input} />
              </div>
              <div>
                <label className={label}>Budget ($)</label>
                <input
                  name="budget"
                  type="number"
                  step="1"
                  min="5"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={input}
                />
              </div>
            </div>
            {budget && parseFloat(budget) >= 5 && (
              <p className="mt-3 text-[12px] text-text-secondary">
                That&apos;s up to <span className="font-semibold text-coral">{clicks} clicks</span> at $0.50 each. Once spent, the offer pauses until you add more.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish Offer"}
          </button>
        </form>
      </div>
    </div>
  );
}

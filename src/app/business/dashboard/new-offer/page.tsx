"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOffer() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title"), description: fd.get("description"),
      imageUrl: fd.get("imageUrl") || undefined,
      redeemUrl: fd.get("redeemUrl") || undefined,
      radiusMiles: parseFloat(fd.get("radiusMiles") as string) || 3,
      budgetCents: Math.round(parseFloat(fd.get("budget") as string) * 100) || 10000,
      cpcCents: Math.round(parseFloat(fd.get("cpc") as string) * 100) || 50,
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

  const input = "w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const label = "block text-[13px] font-medium text-text-secondary mb-1.5";

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
        Create an offer
      </h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        This will appear on apartment websites near your business.
        Renters tap &ldquo;Get This Perk&rdquo; to redeem.
      </p>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className={label}>Headline</label>
          <input name="title" required placeholder="e.g. 20% off your first visit" className={input} />
        </div>

        <div>
          <label className={label}>Details</label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="What will renters get? Keep it short and specific."
            className={input}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Image URL <span className="text-text-tertiary">(optional)</span></label>
            <input name="imageUrl" type="url" placeholder="https://..." className={input} />
          </div>
          <div>
            <label className={label}>Redeem link <span className="text-text-tertiary">(optional)</span></label>
            <input name="redeemUrl" type="url" placeholder="https://..." className={input} />
          </div>
        </div>

        <div className="rounded-2xl border border-glass-border bg-surface-raised p-5">
          <p className="text-[13px] font-medium text-text-primary">Targeting &amp; budget</p>
          <p className="mt-0.5 text-[13px] text-text-tertiary">
            Your offer shows on apartment websites within your radius. You pay per click.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Radius (mi)</label>
              <input name="radiusMiles" type="number" step="0.5" defaultValue="3" min="0.5" max="25" className={input} />
            </div>
            <div>
              <label className={label}>Budget ($)</label>
              <input name="budget" type="number" step="1" defaultValue="100" min="10" className={input} />
            </div>
            <div>
              <label className={label}>Per click ($)</label>
              <input name="cpc" type="number" step="0.05" defaultValue="0.50" min="0.05" className={input} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-text-primary py-3 text-[15px] font-medium text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Offer"}
        </button>
      </form>
    </div>
  );
}

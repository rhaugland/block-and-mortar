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
      title: fd.get("title"),
      description: fd.get("description"),
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

  const inputClass =
    "w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Create New Offer</h1>
      <p className="mt-1 text-sm text-stone-500">
        Set up a coupon or deal that prospective renters will see.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className={labelClass}>Offer Title *</label>
          <input name="title" required placeholder="e.g. 20% off your first visit" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Tell prospective renters what they'll get..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Image URL</label>
          <input name="imageUrl" type="url" placeholder="https://..." className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Redeem URL</label>
          <input
            name="redeemUrl"
            type="url"
            placeholder="https://your-site.com/coupon"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Radius (miles)</label>
            <input name="radiusMiles" type="number" step="0.5" defaultValue="3" min="0.5" max="25" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Budget ($)</label>
            <input name="budget" type="number" step="1" defaultValue="100" min="10" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cost per click ($)</label>
            <input name="cpc" type="number" step="0.05" defaultValue="0.50" min="0.05" className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Offer"}
        </button>
      </form>
    </div>
  );
}

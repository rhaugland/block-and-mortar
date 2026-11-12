"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Offer {
  id: string;
  title: string;
  description: string;
  active: boolean;
  budgetCents: number;
  spentCents: number;
  cpcCents: number;
  radiusMiles: number;
  impressions: number;
  clicks: number;
}

export default function BusinessDashboard() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business/offers")
      .then((r) => {
        if (!r.ok) { window.location.href = "/business/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalImpressions = offers.reduce((s, o) => s + o.impressions, 0);
  const totalClicks = offers.reduce((s, o) => s + o.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
  const totalSpent = offers.reduce((s, o) => s + o.spentCents, 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
            Your offers
          </h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Track how renters engage with your deals.
          </p>
        </div>
        <Link
          href="/business/dashboard/new-offer"
          className="rounded-full bg-text-primary px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-black active:scale-[0.98]"
        >
          New Offer
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Impressions", value: totalImpressions.toLocaleString() },
          { label: "Clicks", value: totalClicks.toLocaleString() },
          { label: "Click rate", value: `${ctr}%` },
          { label: "Total spent", value: `$${(totalSpent / 100).toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-glass-border bg-surface-raised p-5">
            <p className="text-[13px] font-medium text-text-tertiary">{s.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Offers */}
      <div className="mt-10">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-glass-border py-16">
            <p className="text-[15px] text-text-secondary">No offers yet</p>
            <Link
              href="/business/dashboard/new-offer"
              className="mt-3 text-[13px] font-medium text-accent hover:text-accent-hover"
            >
              Create your first offer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => {
              const budgetPct = Math.min(100, (offer.spentCents / offer.budgetCents) * 100);
              const depleted = offer.spentCents >= offer.budgetCents;
              const status = depleted ? "Depleted" : offer.active ? "Live" : "Paused";
              const dot = depleted ? "bg-red-400" : offer.active ? "bg-green-400" : "bg-text-tertiary";

              return (
                <div key={offer.id} className="rounded-2xl border border-glass-border bg-surface-raised p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-semibold text-text-primary">{offer.title}</h3>
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-text-secondary line-clamp-2">{offer.description}</p>

                  {/* Budget bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[12px] text-text-tertiary">
                      <span>${(offer.spentCents / 100).toFixed(2)} spent</span>
                      <span>${(offer.budgetCents / 100).toFixed(2)} budget</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-4 text-[12px] text-text-tertiary">
                    <span>{offer.impressions.toLocaleString()} views</span>
                    <span>{offer.clicks.toLocaleString()} clicks</span>
                    <span>{offer.radiusMiles} mi</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

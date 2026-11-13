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
  expiresAt: string | null;
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
    <div className="mx-auto max-w-5xl px-6 py-10">
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
          className="rounded-full bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]"
        >
          + New Offer
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Impressions", value: totalImpressions.toLocaleString(), color: "bg-sunflower-soft/60 border-sunflower/20" },
          { label: "Clicks", value: totalClicks.toLocaleString(), color: "bg-coral-soft/50 border-coral/15" },
          { label: "Click rate", value: `${ctr}%`, color: "bg-white/70 border-glass-border" },
          { label: "Total spent", value: `$${(totalSpent / 100).toFixed(2)}`, color: "bg-white/70 border-glass-border", accent: true },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 backdrop-blur-sm ${s.color}`}>
            <p className="text-[13px] font-medium text-text-tertiary">{s.label}</p>
            <p className={`mt-1 text-[28px] font-semibold tracking-[-0.02em] ${"accent" in s && s.accent ? "bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent" : "text-text-primary"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Offers */}
      <div className="mt-10">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-glass-border bg-white/50 py-16 backdrop-blur-sm">
            <p className="text-[15px] text-text-secondary">No offers yet</p>
            <Link
              href="/business/dashboard/new-offer"
              className="mt-3 text-[13px] font-medium text-coral hover:text-peach"
            >
              Create your first offer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => {
              const budgetPct = Math.min(100, (offer.spentCents / offer.budgetCents) * 100);
              const depleted = offer.spentCents >= offer.budgetCents;
              const expired = offer.expiresAt && new Date(offer.expiresAt) < new Date();
              const status = depleted ? "Budget spent" : expired ? "Expired" : offer.active ? "Live" : "Paused";
              const dotColor = depleted || expired ? "bg-red-400" : offer.active ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]" : "bg-text-tertiary";
              const barColor = depleted ? "bg-red-400" : "bg-gradient-to-r from-coral to-peach";

              return (
                <div key={offer.id} className="rounded-2xl border border-glass-border bg-white/70 p-5 backdrop-blur-sm transition-shadow hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-semibold text-text-primary">{offer.title}</h3>
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
                      <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
                      {status}
                    </span>
                  </div>

                  {/* Budget bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[12px] text-text-tertiary">
                      <span>${(offer.spentCents / 100).toFixed(2)} spent</span>
                      <span>${(offer.budgetCents / 100).toFixed(2)} budget</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                    {depleted && (
                      <p className="mt-2 text-[11px] font-medium text-red-500">
                        Budget depleted — offer is paused
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-4 text-[12px] text-text-tertiary">
                    <span>{offer.impressions.toLocaleString()} views</span>
                    <span>{offer.clicks.toLocaleString()} clicks</span>
                    <span>{offer.radiusMiles} mi radius</span>
                    <span>$0.50/click</span>
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

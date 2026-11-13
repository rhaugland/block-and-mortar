"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalProperties: number;
  totalBusinesses: number;
  totalOffers: number;
  activeOffers: number;
  totalImpressions: number;
  totalClicks: number;
  totalRedemptions: number;
  totalRevenueCents: number;
  totalOwedCents: number;
  netRevenueCents: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => setStats(d.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Properties", value: stats.totalProperties, color: "border-sunflower/20 bg-sunflower-soft/60" },
    { label: "Businesses", value: stats.totalBusinesses, color: "border-coral/15 bg-coral-soft/50" },
    { label: "Active Offers", value: `${stats.activeOffers} / ${stats.totalOffers}`, color: "border-glass-border bg-white/70" },
    { label: "Impressions", value: stats.totalImpressions.toLocaleString(), color: "border-sunflower/20 bg-sunflower-soft/60" },
    { label: "Clicks", value: stats.totalClicks.toLocaleString(), color: "border-coral/15 bg-coral-soft/50" },
    { label: "Redemptions", value: stats.totalRedemptions.toLocaleString(), color: "border-glass-border bg-white/70" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Platform Overview</h1>
        <p className="mt-1 text-[15px] text-text-secondary">Real-time snapshot of Block &amp; Mortar.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 backdrop-blur-sm ${c.color}`}>
            <p className="text-[13px] font-medium text-text-tertiary">{c.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue summary */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sunflower/20 bg-sunflower-soft/60 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Total Revenue</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
            ${(stats.totalRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">CPC charges from businesses</p>
        </div>
        <div className="rounded-2xl border border-coral/15 bg-coral-soft/50 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Owed to Properties</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
            ${(stats.totalOwedCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">25% affiliate rev share</p>
        </div>
        <div className="rounded-2xl border border-glass-border bg-white/70 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Net Revenue</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
            ${(stats.netRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-text-tertiary">After affiliate payouts</p>
        </div>
      </div>
    </div>
  );
}

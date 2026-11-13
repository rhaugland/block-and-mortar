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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      </div>
    );
  }

  const cards = [
    { label: "Properties", value: stats.totalProperties, color: "from-violet-500/20 to-violet-500/5 border-violet-500/20" },
    { label: "Businesses", value: stats.totalBusinesses, color: "from-sky-500/20 to-sky-500/5 border-sky-500/20" },
    { label: "Active Offers", value: `${stats.activeOffers} / ${stats.totalOffers}`, color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20" },
    { label: "Impressions", value: stats.totalImpressions.toLocaleString(), color: "from-amber-500/20 to-amber-500/5 border-amber-500/20" },
    { label: "Clicks", value: stats.totalClicks.toLocaleString(), color: "from-rose-500/20 to-rose-500/5 border-rose-500/20" },
    { label: "Redemptions", value: stats.totalRedemptions.toLocaleString(), color: "from-teal-500/20 to-teal-500/5 border-teal-500/20" },
  ];

  const money = [
    { label: "Total Revenue", value: `$${(stats.totalRevenueCents / 100).toFixed(2)}`, sub: "From business CPC charges", color: "text-emerald-400" },
    { label: "Owed to Properties", value: `$${(stats.totalOwedCents / 100).toFixed(2)}`, sub: "25% rev share on clicks", color: "text-amber-400" },
    { label: "Net Revenue", value: `$${(stats.netRevenueCents / 100).toFixed(2)}`, sub: "After affiliate payouts", color: "text-sky-400" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Platform Overview</h1>
      <p className="mt-1 text-[14px] text-slate-400">Real-time snapshot of Block & Mortar.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border bg-gradient-to-br p-5 ${c.color}`}>
            <p className="text-[12px] font-medium text-slate-400">{c.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-tight text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {money.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-[12px] font-medium text-slate-400">{m.label}</p>
            <p className={`mt-1 text-[28px] font-semibold tracking-tight ${m.color}`}>{m.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

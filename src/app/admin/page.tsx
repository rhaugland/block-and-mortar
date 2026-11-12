"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

interface Stats {
  totalProperties: number;
  totalBusinesses: number;
  totalOffers: number;
  totalImpressions: number;
  totalClicks: number;
  totalRevenueCents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Failed to load stats."));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-[15px] text-red-500">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Properties", value: stats.totalProperties },
    { label: "Businesses", value: stats.totalBusinesses },
    { label: "Active offers", value: stats.totalOffers },
    { label: "Impressions", value: stats.totalImpressions.toLocaleString() },
    { label: "Clicks", value: stats.totalClicks.toLocaleString() },
    { label: "Platform revenue", value: `$${(stats.totalRevenueCents / 100).toFixed(2)}`, accent: true },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 border-b border-glass-border bg-glass backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Logo href="/admin" />
          <span className="text-[13px] font-medium text-text-tertiary">Admin</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
          Platform overview
        </h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-glass-border bg-surface-raised p-6">
              <p className="text-[13px] font-medium text-text-tertiary">{card.label}</p>
              <p className={`mt-1 text-[32px] font-semibold tracking-[-0.02em] ${"accent" in card && card.accent ? "text-green-600" : "text-text-primary"}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

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
      .catch(() => setError("Failed to load stats. Are you authorized?"));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  const cards = [
    { label: "Properties", value: stats.totalProperties },
    { label: "Businesses", value: stats.totalBusinesses },
    { label: "Active Offers", value: stats.totalOffers },
    { label: "Impressions", value: stats.totalImpressions.toLocaleString() },
    { label: "Clicks", value: stats.totalClicks.toLocaleString() },
    {
      label: "Platform Revenue",
      value: `$${(stats.totalRevenueCents / 100).toFixed(2)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-stone-900">
            Block &amp; Mortar{" "}
            <span className="text-sm font-normal text-stone-400">Admin</span>
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-stone-900">Platform Overview</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-stone-200 bg-white p-6"
            >
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-1 text-3xl font-bold text-stone-900">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

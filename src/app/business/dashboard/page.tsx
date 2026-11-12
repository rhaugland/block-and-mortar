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
        if (!r.ok) {
          window.location.href = "/business/login";
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalImpressions = offers.reduce((s, o) => s + o.impressions, 0);
  const totalClicks = offers.reduce((s, o) => s + o.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <Link
          href="/business/dashboard/new-offer"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + New Offer
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Impressions</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Clicks</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Click-Through Rate</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">{ctr}%</p>
        </div>
      </div>

      {/* Offers */}
      <h2 className="mt-10 text-lg font-semibold text-stone-900">Your Offers</h2>
      {offers.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-stone-300 p-10 text-center">
          <p className="text-stone-500">No offers yet.</p>
          <Link
            href="/business/dashboard/new-offer"
            className="mt-2 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            Create your first offer
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => {
            const budgetPct = Math.min(100, (offer.spentCents / offer.budgetCents) * 100);
            const depleted = offer.spentCents >= offer.budgetCents;
            const status = depleted ? "Budget Depleted" : offer.active ? "Active" : "Paused";
            const statusColor = depleted
              ? "text-red-600 bg-red-50"
              : offer.active
                ? "text-green-700 bg-green-50"
                : "text-stone-600 bg-stone-100";

            return (
              <div key={offer.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-stone-900">{offer.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500 line-clamp-2">{offer.description}</p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>${(offer.spentCents / 100).toFixed(2)} spent</span>
                    <span>${(offer.budgetCents / 100).toFixed(2)} budget</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-4 text-xs text-stone-500">
                  <span>{offer.impressions.toLocaleString()} impressions</span>
                  <span>{offer.clicks.toLocaleString()} clicks</span>
                  <span>{offer.radiusMiles} mi radius</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

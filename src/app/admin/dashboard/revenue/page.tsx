"use client";

import { useEffect, useState } from "react";

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  email: string;
  budgetCents: number;
  spentCents: number;
  clickCount: number;
  createdAt: string;
}

interface PropertyPayout {
  propertyId: string;
  propertyName: string;
  clickCount: number;
  revSharePct: number;
  owedCents: number;
}

interface Stats {
  totalRevenueCents: number;
  totalOwedCents: number;
  netRevenueCents: number;
}

export default function AdminRevenue() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [payouts, setPayouts] = useState<PropertyPayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => {
        setStats(d.stats);
        setBusinesses(d.businesses);
        setPayouts(d.propertyPayouts);
      })
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Revenue &amp; Payouts</h1>
        <p className="mt-1 text-[15px] text-text-secondary">Platform financials at a glance.</p>
      </div>

      {/* Summary cards */}
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

      {/* Business spending */}
      <div className="mt-10">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">Business Spending</h2>
        <p className="mt-1 text-[13px] text-text-secondary">Revenue collected from each business via CPC charges.</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Budget</th>
                <th className="px-4 py-3 text-right">Spent</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const remaining = Math.max(0, b.budgetCents - b.spentCents);
                const depleted = b.budgetCents > 0 && b.spentCents >= b.budgetCents;
                const noBudget = b.budgetCents === 0;

                return (
                  <tr key={b.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{b.name}</td>
                    <td className="px-4 py-3 text-[12px] text-text-secondary">{b.category}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-text-primary">${(b.budgetCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-coral">${(b.spentCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-text-primary">${(remaining / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-text-primary">{b.clickCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {depleted ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Depleted
                        </span>
                      ) : noBudget ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> No budget
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {businesses.length === 0 && (
            <div className="py-16 text-center text-[15px] text-text-secondary">No businesses yet.</div>
          )}
        </div>
      </div>

      {/* Property payouts */}
      <div className="mt-10">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">Property Payouts Owed</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Amount owed to each apartment property based on clicks through their widget.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Rev Share</th>
                <th className="px-4 py-3 text-right">Gross CPC Value</th>
                <th className="px-4 py-3 text-right">Amount Owed</th>
                <th className="px-4 py-3">Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.propertyId} className="border-b border-glass-border/50 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{p.propertyName}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{p.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-secondary">{Math.round(p.revSharePct * 100)}%</td>
                  <td className="px-4 py-3 text-right text-[12px] text-text-secondary">
                    ${(p.clickCount * 0.50).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-medium text-coral">
                    ${(p.owedCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unpaid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payouts.length === 0 && (
            <div className="py-16 text-center text-[15px] text-text-secondary">No payouts owed yet.</div>
          )}
        </div>

        {payouts.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 px-5 py-4 backdrop-blur-sm">
            <div>
              <p className="text-[15px] font-medium text-text-primary">
                Total owed: <span className="font-semibold text-coral">${(stats.totalOwedCents / 100).toFixed(2)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-text-tertiary">Across {payouts.length} properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

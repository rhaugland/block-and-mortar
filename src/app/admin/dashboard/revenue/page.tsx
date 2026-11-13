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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Revenue & Payouts</h1>
      <p className="mt-1 text-[14px] text-slate-400">Platform financials at a glance.</p>

      {/* Summary cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-[12px] font-medium text-slate-400">Total Revenue</p>
          <p className="mt-1 text-[32px] font-semibold tracking-tight text-emerald-400">
            ${(stats.totalRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">CPC charges from businesses</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-[12px] font-medium text-slate-400">Owed to Properties</p>
          <p className="mt-1 text-[32px] font-semibold tracking-tight text-amber-400">
            ${(stats.totalOwedCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Affiliate rev share (25%)</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-5">
          <p className="text-[12px] font-medium text-slate-400">Net Revenue</p>
          <p className="mt-1 text-[32px] font-semibold tracking-tight text-sky-400">
            ${(stats.netRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">After affiliate payouts</p>
        </div>
      </div>

      {/* Business spending */}
      <div className="mt-10">
        <h2 className="text-[18px] font-semibold text-white">Business Spending</h2>
        <p className="mt-1 text-[13px] text-slate-400">Revenue collected from each business via CPC charges.</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-[13px] font-medium text-white">{b.name}</td>
                    <td className="px-4 py-3 text-[12px] text-slate-400">{b.category}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-slate-300">${(b.budgetCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-emerald-400 font-medium">${(b.spentCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-slate-300">${(remaining / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-slate-300">{b.clickCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {depleted ? (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">Depleted</span>
                      ) : noBudget ? (
                        <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">No budget</span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Active</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {businesses.length === 0 && (
            <div className="py-12 text-center text-[14px] text-slate-500">No businesses yet.</div>
          )}
        </div>
      </div>

      {/* Property payouts */}
      <div className="mt-10">
        <h2 className="text-[18px] font-semibold text-white">Property Payouts Owed</h2>
        <p className="mt-1 text-[13px] text-slate-400">
          Amount owed to each apartment property based on clicks through their widget.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Rev Share %</th>
                <th className="px-4 py-3 text-right">CPC Value</th>
                <th className="px-4 py-3 text-right">Amount Owed</th>
                <th className="px-4 py-3">Payout Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.propertyId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-[13px] font-medium text-white">{p.propertyName}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{p.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{Math.round(p.revSharePct * 100)}%</td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-400">
                    ${(p.clickCount * 0.50).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-medium text-amber-400">
                    ${(p.owedCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                      Unpaid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payouts.length === 0 && (
            <div className="py-12 text-center text-[14px] text-slate-500">No payouts owed yet.</div>
          )}
        </div>

        {payouts.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <p className="text-[14px] font-medium text-white">
                Total owed: <span className="text-amber-400">${(stats.totalOwedCents / 100).toFixed(2)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">Across {payouts.length} properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

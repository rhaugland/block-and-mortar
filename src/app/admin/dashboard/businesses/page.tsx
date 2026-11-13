"use client";

import { useEffect, useState } from "react";

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  email: string;
  budgetCents: number;
  spentCents: number;
  offerCount: number;
  clickCount: number;
  redemptionCount: number;
  createdAt: string;
}

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => setBusinesses(d.businesses))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Businesses</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{businesses.length} businesses signed up.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-center">Offers</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => {
              const pct = b.budgetCents > 0 ? (b.spentCents / b.budgetCents) * 100 : 0;
              const depleted = b.budgetCents > 0 && b.spentCents >= b.budgetCents;
              const noBudget = b.budgetCents === 0;

              return (
                <tr key={b.id} className="border-b border-glass-border/50 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{b.name}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{b.category}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{b.city}, {b.state}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{b.email}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">${(b.budgetCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">${(b.spentCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-[13px] text-text-primary">{b.offerCount}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{b.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{b.redemptionCount.toLocaleString()}</td>
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
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {Math.round(pct)}% used
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-tertiary">
                    {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
  );
}

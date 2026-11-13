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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Businesses</h1>
      <p className="mt-1 text-[14px] text-slate-400">{businesses.length} businesses signed up.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-[13px] font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{b.category}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{b.city}, {b.state}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{b.email}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">
                    ${(b.budgetCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">
                    ${(b.spentCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-[13px] text-slate-300">{b.offerCount}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{b.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{b.redemptionCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {depleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Depleted
                      </span>
                    ) : noBudget ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> No budget
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {Math.round(pct)}% used
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">
                    {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
  );
}

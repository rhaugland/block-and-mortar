"use client";

import { useEffect, useState } from "react";

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  spentCents: number;
  clickCount: number;
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

type OpenPanel = "revenue" | "payouts" | null;

export default function AdminRevenue() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [payouts, setPayouts] = useState<PropertyPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<OpenPanel>(null);

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

  const toggle = (panel: OpenPanel) => setOpen((prev) => prev === panel ? null : panel);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Revenue</h1>
        <p className="mt-1 text-[15px] text-text-secondary">Platform financials at a glance.</p>
      </div>

      {/* Three cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {/* Revenue */}
        <button
          onClick={() => toggle("revenue")}
          className={`rounded-2xl border p-6 text-left backdrop-blur-sm transition-all hover:shadow-lg ${
            open === "revenue"
              ? "border-sunflower/40 bg-sunflower-soft/80 shadow-md"
              : "border-sunflower/20 bg-sunflower-soft/60 hover:border-sunflower/30"
          }`}
        >
          <p className="text-[13px] font-medium text-text-tertiary">Revenue</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] text-text-primary">
            ${(stats.totalRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <span>{businesses.length} businesses</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open === "revenue" ? "rotate-180" : ""}`}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </p>
        </button>

        {/* Payouts */}
        <button
          onClick={() => toggle("payouts")}
          className={`rounded-2xl border p-6 text-left backdrop-blur-sm transition-all hover:shadow-lg ${
            open === "payouts"
              ? "border-coral/30 bg-coral-soft/70 shadow-md"
              : "border-coral/15 bg-coral-soft/50 hover:border-coral/25"
          }`}
        >
          <p className="text-[13px] font-medium text-text-tertiary">Payouts</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] text-text-primary">
            ${(stats.totalOwedCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <span>{payouts.length} properties</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open === "payouts" ? "rotate-180" : ""}`}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </p>
        </button>

        {/* Profit */}
        <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Profit</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
            ${(stats.netRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-[12px] text-text-tertiary">Revenue minus payouts</p>
        </div>
      </div>

      {/* Revenue breakdown */}
      {open === "revenue" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-sunflower/20 bg-white/70 backdrop-blur-sm">
          <div className="border-b border-glass-border bg-sunflower-soft/30 px-5 py-3">
            <p className="text-[13px] font-semibold text-text-primary">Revenue by Business</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Claims</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {businesses
                .filter((b) => b.spentCents > 0)
                .sort((a, b) => b.spentCents - a.spentCents)
                .map((b) => (
                  <tr key={b.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{b.name}</td>
                    <td className="px-5 py-3 text-[12px] text-text-secondary">{b.category}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-text-primary">{b.clickCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-medium text-text-primary">${(b.spentCents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-[12px] text-text-secondary">
                      {stats.totalRevenueCents > 0 ? ((b.spentCents / stats.totalRevenueCents) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              {businesses.filter((b) => b.spentCents > 0).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[14px] text-text-tertiary">No revenue yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts breakdown — expandable from card */}
      {open === "payouts" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-coral/15 bg-white/70 backdrop-blur-sm">
          <div className="border-b border-glass-border bg-coral-soft/20 px-5 py-3">
            <p className="text-[13px] font-semibold text-text-primary">Payouts by Property</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3 text-right">Claims</th>
                <th className="px-5 py-3 text-right">Rev Share</th>
                <th className="px-5 py-3 text-right">Amount Owed</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts
                .sort((a, b) => b.owedCents - a.owedCents)
                .map((p) => (
                  <tr key={p.propertyId} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{p.propertyName}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-text-primary">{p.clickCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[12px] text-text-secondary">{Math.round(p.revSharePct * 100)}%</td>
                    <td className="px-5 py-3 text-right text-[13px] font-medium text-coral">${(p.owedCents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unpaid
                      </span>
                    </td>
                  </tr>
                ))}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[14px] text-text-tertiary">No payouts owed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Unpaid payouts — always visible */}
      {payouts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">Unpaid Payouts</h2>
          <p className="mt-1 text-[13px] text-text-secondary">Properties with outstanding balances.</p>

          <div className="mt-4 space-y-3">
            {payouts
              .sort((a, b) => b.owedCents - a.owedCents)
              .map((p) => (
                <div key={p.propertyId} className="flex items-center justify-between rounded-2xl border border-glass-border bg-white/70 px-5 py-4 backdrop-blur-sm">
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{p.propertyName}</p>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">{p.clickCount} claims &middot; {Math.round(p.revSharePct * 100)}% rev share</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[18px] font-semibold text-coral">${(p.owedCents / 100).toFixed(2)}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unpaid
                    </span>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 px-5 py-4 backdrop-blur-sm">
            <p className="text-[15px] font-medium text-text-primary">
              Total outstanding: <span className="font-semibold text-coral">${(stats.totalOwedCents / 100).toFixed(2)}</span>
            </p>
            <p className="mt-0.5 text-[12px] text-text-tertiary">Across {payouts.length} properties</p>
          </div>
        </div>
      )}
    </div>
  );
}

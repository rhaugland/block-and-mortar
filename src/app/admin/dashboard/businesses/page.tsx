"use client";

import { useEffect, useState } from "react";

interface OfferRow {
  id: string;
  title: string;
  active: boolean;
  radiusMiles: number;
  budgetCents: number;
  spentCents: number;
  cpcCents: number;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  _count: { clicks: number; redemptions: number };
}

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
  offers: OfferRow[];
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-center">Offers</th>
              <th className="px-4 py-3 text-right">Claims</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3">Budget Usage</th>
              <th className="px-4 py-3 text-center">Alerts</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => {
              const isOpen = expanded.has(b.id);
              const pct = b.budgetCents > 0 ? (b.spentCents / b.budgetCents) * 100 : 0;
              const depleted = b.budgetCents > 0 && b.spentCents >= b.budgetCents;
              const noBudget = b.budgetCents === 0;

              // Check for expiring offers (within 3 days) or expired active offers
              const expiringOffers = b.offers.filter((o) => {
                if (!o.expiresAt) return false;
                const days = daysLeft(o.expiresAt);
                return days !== null && days <= 3;
              });
              const hasAlert = expiringOffers.length > 0;

              return (
                <>
                  <tr
                    key={b.id}
                    onClick={() => toggle(b.id)}
                    className={`border-b border-glass-border/50 cursor-pointer transition-colors hover:bg-white/40 ${isOpen ? "bg-white/30" : ""}`}
                  >
                    <td className="px-3 py-3 text-text-tertiary">
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                      >
                        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      {hasAlert ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600" title={`${expiringOffers.length} offer${expiringOffers.length > 1 ? "s" : ""} expiring soon`}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1L11 10H1L6 1Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                            <path d="M6 4.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            <circle cx="6" cy="8" r="0.5" fill="currentColor"/>
                          </svg>
                          {expiringOffers.length}
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded offers */}
                  {isOpen && (
                    <tr key={`${b.id}-offers`}>
                      <td colSpan={12} className="bg-surface/50 px-0 py-0">
                        <div className="mx-6 my-3">
                          {b.offers.length === 0 ? (
                            <p className="py-4 text-center text-[13px] text-text-tertiary">No offers created yet.</p>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-glass-border bg-white/60">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="border-b border-glass-border bg-white/40 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                                    <th className="px-3 py-2">Offer</th>
                                    <th className="px-3 py-2 text-center">Status</th>
                                    <th className="px-3 py-2 text-right">Radius</th>
                                    <th className="px-3 py-2 text-right">CPC</th>
                                    <th className="px-3 py-2 text-right">Spent</th>
                                    <th className="px-3 py-2 text-right">Claims</th>
                                    <th className="px-3 py-2 text-right">Redeemed</th>
                                    <th className="px-3 py-2">Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.offers.map((o) => {
                                    const expired = o.expiresAt && new Date(o.expiresAt) < new Date();
                                    const days = daysLeft(o.expiresAt);
                                    const status = expired ? "Expired" : o.active ? "Live" : "Paused";
                                    const dotColor = expired ? "bg-red-500" : o.active ? "bg-green-500" : "bg-text-tertiary";
                                    const isExpiring = days !== null && days > 0 && days <= 3;

                                    return (
                                      <tr key={o.id} className="border-b border-glass-border/50 last:border-0">
                                        <td className="px-3 py-2.5 text-[12px] font-medium text-text-primary">{o.title}</td>
                                        <td className="px-3 py-2.5 text-center">
                                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                            expired ? "bg-red-50 text-red-600" : o.active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"
                                          }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                                            {status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[12px] text-text-secondary">{o.radiusMiles} mi</td>
                                        <td className="px-3 py-2.5 text-right text-[12px] text-text-secondary">${(o.cpcCents / 100).toFixed(2)}</td>
                                        <td className="px-3 py-2.5 text-right text-[12px] text-text-primary">${(o.spentCents / 100).toFixed(2)}</td>
                                        <td className="px-3 py-2.5 text-right text-[12px] text-text-primary">{o._count.clicks.toLocaleString()}</td>
                                        <td className="px-3 py-2.5 text-right text-[12px] text-text-primary">{o._count.redemptions.toLocaleString()}</td>
                                        <td className="px-3 py-2.5 text-[12px] text-text-secondary">
                                          {days !== null ? (
                                            <span className={`${days === 0 ? "font-medium text-red-600" : isExpiring ? "font-medium text-red-500" : ""}`}>
                                              {days === 0 ? "Expired" : `${days}d left`}
                                              {isExpiring && (
                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="ml-1 inline text-red-500">
                                                  <path d="M6 1L11 10H1L6 1Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                                                  <path d="M6 4.5V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                                  <circle cx="6" cy="8" r="0.5" fill="currentColor"/>
                                                </svg>
                                              )}
                                            </span>
                                          ) : (
                                            "No expiry"
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
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

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
  business: { id: string; name: string };
  _count: { impressions: number; clicks: number; redemptions: number };
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminOffers() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => setOffers(d.offers))
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
      <h1 className="text-[24px] font-semibold tracking-tight">Offers</h1>
      <p className="mt-1 text-[14px] text-slate-400">
        {offers.filter((o) => o.active).length} active out of {offers.length} total offers.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Radius</th>
              <th className="px-4 py-3 text-right">CPC</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Impr.</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => {
              const expired = o.expiresAt && new Date(o.expiresAt) < new Date();
              const days = daysLeft(o.expiresAt);
              const status = expired ? "Expired" : o.active ? "Live" : "Paused";
              const dotColor = expired ? "bg-red-400" : o.active ? "bg-emerald-400" : "bg-slate-500";

              return (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-[13px] font-medium text-white">{o.title}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{o.business.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-400">{o.radiusMiles} mi</td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-400">${(o.cpcCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">${(o.budgetCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">${(o.spentCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{o._count.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{o._count.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{o._count.redemptions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">
                    {days !== null ? (
                      <span className={days === 0 ? "text-red-400" : days <= 3 ? "text-amber-400" : ""}>
                        {days === 0 ? "Expired" : `${days}d left`}
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
        {offers.length === 0 && (
          <div className="py-12 text-center text-[14px] text-slate-500">No offers yet.</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  redeemedAt: string | null;
  createdAt: string;
  offer: { title: string };
  business: { name: string };
}

export default function PropertyLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/property/leads")
      .then((r) => {
        if (!r.ok) { window.location.href = "/property/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then(setLeads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const claimed = leads.length;
  const redeemed = leads.filter((l) => l.redeemedAt).length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Visitor Leads</h1>
        <p className="mt-1 text-[15px] text-text-secondary">People who claimed offers through your widget.</p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sunflower/20 bg-sunflower-soft/60 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Total leads</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">{claimed}</p>
        </div>
        <div className="rounded-2xl border border-coral/15 bg-coral-soft/50 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Redeemed</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">{redeemed}</p>
        </div>
        <div className="rounded-2xl border border-glass-border bg-white/70 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Redemption rate</p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
            {claimed > 0 ? ((redeemed / claimed) * 100).toFixed(1) : "0.0"}%
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8">
        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border bg-white/50 py-16 text-center backdrop-blur-sm">
            <p className="text-[15px] text-text-secondary">No leads yet</p>
            <p className="mt-1 text-[13px] text-text-tertiary">They&apos;ll appear here when visitors claim perks on your site.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Claimed</th>
                  <th className="px-4 py-3">Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{lead.firstName} {lead.lastName}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{lead.email}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{lead.business.name}</td>
                    <td className="px-4 py-3 text-[13px] text-text-secondary">{lead.offer.title}</td>
                    <td className="px-4 py-3">
                      {lead.redeemedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-600">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> Redeemed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> Claimed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-tertiary">
                      {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-tertiary">
                      {lead.redeemedAt
                        ? new Date(lead.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

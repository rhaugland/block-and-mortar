"use client";

import { useEffect, useState } from "react";

interface PropertyRow {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  email: string;
  widgetEnabled: boolean;
  widgetLastPing: string | null;
  revSharePct: number;
  locationCount: number;
  clickCount: number;
  redemptionCount: number;
  createdAt: string;
}

export default function AdminProperties() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => setProperties(d.properties))
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
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Properties</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{properties.length} apartment communities signed up.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Locations</th>
              <th className="px-4 py-3 text-center">Widget</th>
              <th className="px-4 py-3 text-right">Claims</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3 text-right">Rev Share</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const installed = p.widgetLastPing != null;
              const recent = installed && (Date.now() - new Date(p.widgetLastPing!).getTime()) < 86400000;

              let widgetLabel: string;
              let badgeBg: string;
              let badgeText: string;
              let dotColor: string;

              if (!p.widgetEnabled) {
                widgetLabel = "Hidden";
                badgeBg = "bg-slate-100";
                badgeText = "text-slate-500";
                dotColor = "bg-slate-400";
              } else if (recent) {
                widgetLabel = "Active";
                badgeBg = "bg-green-50";
                badgeText = "text-green-600";
                dotColor = "bg-green-500";
              } else if (installed) {
                widgetLabel = "Inactive";
                badgeBg = "bg-amber-50";
                badgeText = "text-amber-600";
                dotColor = "bg-amber-400";
              } else {
                widgetLabel = "Not installed";
                badgeBg = "bg-red-50";
                badgeText = "text-red-500";
                dotColor = "bg-red-400";
              }

              return (
                <tr key={p.id} className="border-b border-glass-border/50 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{p.name}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{p.city}, {p.state}</td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary">{p.email}</td>
                  <td className="px-4 py-3 text-center text-[13px] text-text-primary">{p.locationCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeBg} ${badgeText}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      {widgetLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{p.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-primary">{p.redemptionCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-text-secondary">{Math.round(p.revSharePct * 100)}%</td>
                  <td className="px-4 py-3 text-[12px] text-text-tertiary">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {properties.length === 0 && (
          <div className="py-16 text-center text-[15px] text-text-secondary">No properties yet.</div>
        )}
      </div>
    </div>
  );
}

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
  impressionCount: number;
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-[24px] font-semibold tracking-tight">Properties</h1>
      <p className="mt-1 text-[14px] text-slate-400">{properties.length} apartment communities signed up.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-center">Locations</th>
              <th className="px-4 py-3 text-center">Widget</th>
              <th className="px-4 py-3 text-right">Impressions</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">Redeemed</th>
              <th className="px-4 py-3 text-right">Rev Share</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => {
              const installed = p.widgetLastPing != null;
              const recent = installed && (Date.now() - new Date(p.widgetLastPing!).getTime()) < 86400000;
              const widgetStatus = !p.widgetEnabled ? "Off" : recent ? "Live" : installed ? "Stale" : "Not installed";
              const dotColor = !p.widgetEnabled ? "bg-slate-500" : recent ? "bg-emerald-400" : "bg-amber-400";

              return (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-[13px] font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{p.city}, {p.state}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{p.email}</td>
                  <td className="px-4 py-3 text-center text-[13px] text-slate-300">{p.locationCount}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      {widgetStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{p.impressionCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{p.clickCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{p.redemptionCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-300">{Math.round(p.revSharePct * 100)}%</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {properties.length === 0 && (
          <div className="py-12 text-center text-[14px] text-slate-500">No properties yet.</div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalProperties: number;
  totalBusinesses: number;
  totalOffers: number;
  activeOffers: number;
  totalClicks: number;
  totalRedemptions: number;
  totalRevenueCents: number;
  totalOwedCents: number;
  netRevenueCents: number;
}

interface PropertyRow {
  id: string;
  name: string;
  widgetEnabled: boolean;
  widgetLastPing: string | null;
}

interface OfferInfo {
  id: string;
  title: string;
  active: boolean;
  expiresAt: string | null;
  _count: { clicks: number; redemptions: number };
}

interface BusinessRow {
  id: string;
  name: string;
  offers: OfferInfo[];
}

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => {
        setStats(d.stats);
        setProperties(d.properties);
        setBusinesses(d.businesses);
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

  // Widget breakdown
  const widgetActive = properties.filter((p) => p.widgetEnabled && p.widgetLastPing && (Date.now() - new Date(p.widgetLastPing).getTime()) < 86400000);
  const widgetInactive = properties.filter((p) => p.widgetEnabled && p.widgetLastPing && (Date.now() - new Date(p.widgetLastPing).getTime()) >= 86400000);
  const widgetNotInstalled = properties.filter((p) => p.widgetEnabled && !p.widgetLastPing);
  const widgetHidden = properties.filter((p) => !p.widgetEnabled);

  // Expiring / expired
  const alerts: { type: "expired" | "expiring"; title: string; businessName: string; days: number | null }[] = [];
  for (const b of businesses) {
    for (const o of b.offers) {
      if (!o.expiresAt || !o.active) continue;
      const d = daysLeft(o.expiresAt);
      if (d === 0) alerts.push({ type: "expired", title: o.title, businessName: b.name, days: 0 });
      else if (d !== null && d <= 5) alerts.push({ type: "expiring", title: o.title, businessName: b.name, days: d });
    }
  }

  const redemptionRate = stats.totalClicks > 0
    ? ((stats.totalRedemptions / stats.totalClicks) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Overview</h1>
        <p className="mt-1 text-[15px] text-text-secondary">What needs your attention right now.</p>
      </div>

      {/* ── Alerts Card ── */}
      {(alerts.length > 0 || widgetNotInstalled.length > 0) && (
        <div className="mt-8 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="text-coral">
                <path d="M8 1.5L14.5 13H1.5L8 1.5Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M8 6V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.6" fill="currentColor"/>
              </svg>
              <p className="text-[16px] font-semibold text-text-primary">Action Needed</p>
            </div>
            <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[12px] font-semibold text-coral">
              {alerts.length + widgetNotInstalled.length}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                a.type === "expired" ? "border border-red-200 bg-red-50" : "border border-amber-200 bg-amber-50"
              }`}>
                <div>
                  <p className={`text-[13px] font-medium ${a.type === "expired" ? "text-red-700" : "text-amber-800"}`}>
                    {a.type === "expired" ? "Expired" : `Expires in ${a.days}d`}: &ldquo;{a.title}&rdquo;
                  </p>
                  <p className={`text-[12px] ${a.type === "expired" ? "text-red-500" : "text-amber-600"}`}>
                    {a.businessName} &mdash; {a.type === "expired" ? "deal has ended" : "reach out to renew"}
                  </p>
                </div>
                <Link href="/admin/dashboard/businesses" className={`shrink-0 text-[12px] font-medium ${a.type === "expired" ? "text-red-600" : "text-amber-700"}`}>
                  View &rarr;
                </Link>
              </div>
            ))}
            {widgetNotInstalled.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-surface/50 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{p.name} &mdash; widget not installed</p>
                  <p className="text-[12px] text-text-tertiary">Signed up but hasn&apos;t added the embed code yet</p>
                </div>
                <Link href="/admin/dashboard/properties" className="shrink-0 text-[12px] font-medium text-coral">View &rarr;</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Claims & Redemptions Card ── */}
      <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <p className="text-[16px] font-semibold text-text-primary">Claims &amp; Redemptions</p>

        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-[12px] font-medium text-text-tertiary">Total Claims</p>
            <p className="mt-1 text-[32px] font-semibold tracking-tight text-text-primary">{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-text-tertiary">Redeemed</p>
            <p className="mt-1 text-[32px] font-semibold tracking-tight text-text-primary">{stats.totalRedemptions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-text-tertiary">Redemption Rate</p>
            <p className="mt-1 text-[32px] font-semibold tracking-tight text-text-primary">{redemptionRate}%</p>
          </div>
        </div>

        {/* Mini bar */}
        {stats.totalClicks > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-text-tertiary">
              <span>{stats.totalRedemptions} redeemed</span>
              <span>{stats.totalClicks - stats.totalRedemptions} pending</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coral to-peach transition-all"
                style={{ width: `${(stats.totalRedemptions / stats.totalClicks) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Revenue + Widget Status ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue */}
        <Link href="/admin/dashboard/revenue" className="group rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm transition-all hover:shadow-md hover:border-coral/20">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-text-primary">Revenue</p>
            <span className="text-[12px] font-medium text-text-tertiary group-hover:text-coral transition-colors">Details &rarr;</span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">Revenue</span>
              <span className="text-[15px] font-semibold text-text-primary">${(stats.totalRevenueCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-text-secondary">Payouts</span>
              <span className="text-[15px] font-medium text-text-secondary">-${(stats.totalOwedCents / 100).toFixed(2)}</span>
            </div>
            <div className="border-t border-glass-border pt-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-text-primary">Profit</span>
              <span className="text-[20px] font-semibold bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
                ${(stats.netRevenueCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </Link>

        {/* Widget Status */}
        <Link href="/admin/dashboard/properties" className="group rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm transition-all hover:shadow-md hover:border-coral/20">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-text-primary">Widget Status</p>
            <span className="text-[12px] font-medium text-text-tertiary group-hover:text-coral transition-colors">All properties &rarr;</span>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { label: "Active", count: widgetActive.length, dot: "bg-green-500", desc: "Widget live & pinging" },
              { label: "Inactive", count: widgetInactive.length, dot: "bg-amber-400", desc: "No ping in 24h+" },
              { label: "Not installed", count: widgetNotInstalled.length, dot: "bg-red-400", desc: "Signed up, no embed" },
              { label: "Hidden", count: widgetHidden.length, dot: "bg-slate-400", desc: "Toggled off by property" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.dot}`} />
                  <div>
                    <span className="text-[13px] font-medium text-text-primary">{row.label}</span>
                    <span className="ml-2 text-[11px] text-text-tertiary">{row.desc}</span>
                  </div>
                </div>
                <span className="text-[16px] font-semibold text-text-primary">{row.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-glass-border pt-3 flex items-center justify-between">
            <span className="text-[13px] text-text-secondary">Total properties</span>
            <span className="text-[15px] font-semibold text-text-primary">{stats.totalProperties}</span>
          </div>
        </Link>
      </div>

      {/* ── Platform Counts ── */}
      <div className="mt-6 grid gap-6 grid-cols-2">
        <Link href="/admin/dashboard/businesses" className="group rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm transition-all hover:shadow-md hover:border-coral/20">
          <p className="text-[12px] font-medium text-text-tertiary">Businesses</p>
          <p className="mt-2 text-[32px] font-semibold tracking-tight text-text-primary">{stats.totalBusinesses}</p>
          <p className="mt-1 text-[13px] text-text-secondary">{stats.activeOffers} active offers</p>
          <p className="mt-2 text-[12px] text-text-tertiary group-hover:text-coral transition-colors">View all &rarr;</p>
        </Link>
        <Link href="/admin/dashboard/properties" className="group rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm transition-all hover:shadow-md hover:border-coral/20">
          <p className="text-[12px] font-medium text-text-tertiary">Properties</p>
          <p className="mt-2 text-[32px] font-semibold tracking-tight text-text-primary">{stats.totalProperties}</p>
          <p className="mt-1 text-[13px] text-text-secondary">{widgetActive.length} widgets live</p>
          <p className="mt-2 text-[12px] text-text-tertiary group-hover:text-coral transition-colors">View all &rarr;</p>
        </Link>
      </div>
    </div>
  );
}

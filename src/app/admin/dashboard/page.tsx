"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MonthlyReportToggle } from "@/components/monthly-report-toggle";

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

interface SignupDay { day: string; businesses: number; properties: number }
interface ActivityDay { day: string; claims: number; redeemed: number }

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
  const [signups, setSignups] = useState<SignupDay[]>([]);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bm_dismissed_alerts");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const dismissAlert = (key: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(key);
      localStorage.setItem("bm_dismissed_alerts", JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/overview").then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      }),
      fetch("/api/admin/charts").then((r) => r.ok ? r.json() : { signups: [], activity: [] }),
    ])
      .then(([overview, charts]) => {
        setStats(overview.stats);
        setProperties(overview.properties);
        setBusinesses(overview.businesses);
        setSignups(charts.signups || []);
        setActivity(charts.activity || []);
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
      {(() => {
        const visibleAlerts = alerts.filter((a) => !dismissed.has(`offer-${a.title}-${a.businessName}`));
        const visibleWidgets = widgetNotInstalled.filter((p) => !dismissed.has(`widget-${p.id}`));
        const visibleCount = visibleAlerts.length + visibleWidgets.length;
        if (visibleCount === 0) return null;
        return true;
      })() && (
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
              {alerts.filter((a) => !dismissed.has(`offer-${a.title}-${a.businessName}`)).length + widgetNotInstalled.filter((p) => !dismissed.has(`widget-${p.id}`)).length}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {alerts.filter((a) => !dismissed.has(`offer-${a.title}-${a.businessName}`)).map((a, i) => {
              const key = `offer-${a.title}-${a.businessName}`;
              return (
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
                  <div className="flex items-center gap-3">
                    <Link href="/admin/dashboard/businesses" className={`shrink-0 text-[12px] font-medium ${a.type === "expired" ? "text-red-600" : "text-amber-700"}`}>
                      View &rarr;
                    </Link>
                    <button onClick={() => dismissAlert(key)} className={`shrink-0 rounded-full p-1 transition-colors hover:bg-black/5 ${a.type === "expired" ? "text-red-400 hover:text-red-600" : "text-amber-400 hover:text-amber-600"}`} title="Dismiss">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
            {widgetNotInstalled.filter((p) => !dismissed.has(`widget-${p.id}`)).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-surface/50 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{p.name} &mdash; widget not installed</p>
                  <p className="text-[12px] text-text-tertiary">Signed up but hasn&apos;t added the embed code yet</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/admin/dashboard/properties" className="shrink-0 text-[12px] font-medium text-coral">View &rarr;</Link>
                  <button onClick={() => dismissAlert(`widget-${p.id}`)} className="shrink-0 rounded-full p-1 text-text-tertiary transition-colors hover:bg-black/5 hover:text-text-primary" title="Dismiss">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
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

      {/* Monthly Report Toggle */}
      <div className="mt-6">
        <MonthlyReportToggle apiPath="/api/admin/monthly-report" />
      </div>

      {/* ── Growth Charts ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Customer Growth */}
        <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <p className="text-[16px] font-semibold text-text-primary">Customer Growth</p>
          <p className="mt-0.5 text-[12px] text-text-tertiary">Last 30 days &middot; cumulative</p>
          {signups.length > 0 && (() => {
            const maxVal = Math.max(...signups.map((s) => Math.max(s.businesses, s.properties)), 1);
            const W = 100;
            const H = 40;
            const step = W / Math.max(signups.length - 1, 1);
            const bizPoints = signups.map((s, i) => `${(i * step).toFixed(1)},${(H - (s.businesses / maxVal) * H * 0.85 - H * 0.05).toFixed(1)}`).join(" ");
            const propPoints = signups.map((s, i) => `${(i * step).toFixed(1)},${(H - (s.properties / maxVal) * H * 0.85 - H * 0.05).toFixed(1)}`).join(" ");
            const lastBiz = signups[signups.length - 1];

            return (
              <div className="mt-4">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[140px]" preserveAspectRatio="none">
                  <polyline points={propPoints} fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeLinejoin="round" />
                  <polyline points={bizPoints} fill="none" stroke="#ff6b5b" strokeWidth="0.8" strokeLinejoin="round" />
                </svg>
                <div className="mt-3 flex items-center gap-5 text-[12px]">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-coral" />
                    Businesses <span className="font-semibold text-text-primary">{lastBiz.businesses}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-sunflower" />
                    Properties <span className="font-semibold text-text-primary">{lastBiz.properties}</span>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Claims & Redemptions Over Time */}
        <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <p className="text-[16px] font-semibold text-text-primary">Claims &amp; Redemptions</p>
          <p className="mt-0.5 text-[12px] text-text-tertiary">Last 30 days &middot; daily</p>
          {activity.length > 0 && (() => {
            const maxVal = Math.max(...activity.map((a) => Math.max(a.claims, a.redeemed)), 1);
            const W = 100;
            const H = 40;
            const barW = W / activity.length * 0.7;
            const gap = W / activity.length;
            const totalClaims = activity.reduce((s, a) => s + a.claims, 0);
            const totalRedeemed = activity.reduce((s, a) => s + a.redeemed, 0);

            return (
              <div className="mt-4">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[140px]" preserveAspectRatio="none">
                  {activity.map((a, i) => {
                    const claimH = (a.claims / maxVal) * H * 0.85;
                    const redeemH = (a.redeemed / maxVal) * H * 0.85;
                    const x = i * gap + (gap - barW) / 2;
                    return (
                      <g key={i}>
                        <rect x={x} y={H - claimH} width={barW} height={claimH} rx="0.5" fill="#ff6b5b" fillOpacity="0.25" />
                        <rect x={x} y={H - redeemH} width={barW} height={redeemH} rx="0.5" fill="#ff6b5b" />
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-3 flex items-center gap-5 text-[12px]">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-coral/25" />
                    Claims <span className="font-semibold text-text-primary">{totalClaims}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-coral" />
                    Redeemed <span className="font-semibold text-text-primary">{totalRedeemed}</span>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

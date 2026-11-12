"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  property: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    apiKey: string;
  };
  stats: {
    totalImpressions: number;
    totalClicks: number;
    revenueCents: number;
  };
}

export default function PropertyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/property/dashboard")
      .then((r) => {
        if (!r.ok) { window.location.href = "/property/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-api-key="${data.property.apiKey}"></script>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
          {data.property.name}
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          {data.property.address}, {data.property.city}, {data.property.state} {data.property.zip}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Widget impressions", value: data.stats.totalImpressions.toLocaleString() },
          { label: "Perk clicks", value: data.stats.totalClicks.toLocaleString() },
          { label: "Your revenue", value: `$${(data.stats.revenueCents / 100).toFixed(2)}`, accent: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-glass-border bg-surface-raised p-5">
            <p className="text-[13px] font-medium text-text-tertiary">{s.label}</p>
            <p className={`mt-1 text-[28px] font-semibold tracking-[-0.02em] ${s.accent ? "text-green-600" : "text-text-primary"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Embed Code */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-surface-raised p-6">
        <h2 className="text-[17px] font-semibold text-text-primary">
          Add the widget to your website
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Paste this before the closing &lt;/body&gt; tag. The perks panel appears automatically in the bottom-right corner.
        </p>
        <div className="mt-4 rounded-xl bg-[#1d1d1f] p-4">
          <code className="block whitespace-pre-wrap break-all text-[13px] leading-relaxed text-green-400">
            {embedCode}
          </code>
        </div>
        <button
          onClick={copyEmbed}
          className="mt-3 rounded-full border border-glass-border bg-surface px-5 py-2 text-[13px] font-medium text-text-primary transition-all hover:bg-white active:scale-[0.98]"
        >
          {copied ? "Copied" : "Copy snippet"}
        </button>
      </div>

      {/* Widget Preview */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-surface-raised p-6">
        <h2 className="text-[17px] font-semibold text-text-primary">Preview</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          What visitors see when they browse your apartment listing.
        </p>
        <div className="mt-4 relative rounded-xl bg-surface p-8 min-h-[240px] overflow-hidden">
          {/* Fake browser chrome */}
          <div className="flex gap-1.5 mb-6">
            <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
          </div>
          <div className="h-3 w-48 rounded bg-glass-border" />
          <div className="mt-3 h-2 w-64 rounded bg-glass-border" />
          <div className="mt-2 h-2 w-56 rounded bg-glass-border" />

          {/* Widget mockup */}
          <div className="absolute bottom-4 right-4 w-[260px]">
            <div className="rounded-2xl bg-surface-raised shadow-lg border border-glass-border overflow-hidden">
              <div className="bg-accent px-4 py-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white">&#127968; Neighborhood Perks</span>
                <span className="text-white/60 text-[12px]">&times;</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="rounded-xl bg-accent-subtle p-3">
                  <p className="text-[12px] font-semibold text-text-primary">20% off your first meal</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Corner Bistro &middot; Restaurant</p>
                </div>
                <div className="rounded-xl bg-accent-subtle p-3">
                  <p className="text-[12px] font-semibold text-text-primary">Free week trial</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">FitBlock Gym &middot; Fitness</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

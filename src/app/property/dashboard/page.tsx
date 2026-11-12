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
    widgetEnabled: boolean;
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
  const [widgetOpen, setWidgetOpen] = useState(true);
  const [widgetLive, setWidgetLive] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/property/dashboard")
      .then((r) => {
        if (!r.ok) { window.location.href = "/property/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => { setData(d); setWidgetLive(d.property.widgetEnabled); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleWidget = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/property/widget-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !widgetLive }),
      });
      if (res.ok) {
        const { widgetEnabled } = await res.json();
        setWidgetLive(widgetEnabled);
      }
    } catch { /* ignore */ }
    setToggling(false);
  };

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
    <div className="mx-auto max-w-5xl px-6 py-10">
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
          { label: "Widget impressions", value: data.stats.totalImpressions.toLocaleString(), color: "bg-sunflower-soft/60 border-sunflower/20" },
          { label: "Perk clicks", value: data.stats.totalClicks.toLocaleString(), color: "bg-coral-soft/50 border-coral/15" },
          { label: "Your revenue", value: `$${(data.stats.revenueCents / 100).toFixed(2)}`, color: "bg-white/70 border-glass-border", accent: true },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 backdrop-blur-sm ${s.color}`}>
            <p className="text-[13px] font-medium text-text-tertiary">{s.label}</p>
            <p className={`mt-1 text-[28px] font-semibold tracking-[-0.02em] ${s.accent ? "bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent" : "text-text-primary"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Widget Status */}
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-glass-border bg-white/70 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${widgetLive ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" : "bg-text-tertiary"}`} />
          <div>
            <p className="text-[15px] font-medium text-text-primary">
              Widget is {widgetLive ? "live" : "off"}
            </p>
            <p className="text-[12px] text-text-tertiary">
              {widgetLive ? "Visitors can see neighborhood perks on your site" : "The widget is hidden from your website visitors"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleWidget}
          disabled={toggling}
          className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${widgetLive ? "bg-coral" : "bg-text-tertiary/30"} disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${widgetLive ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Embed Code */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <h2 className="text-[17px] font-semibold text-text-primary">
          Add the widget to your website
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Paste this before the closing &lt;/body&gt; tag. The perks panel appears automatically in the bottom-right corner.
        </p>
        <div className="mt-4 rounded-xl bg-[#1d1d1f] p-4">
          <code className="block whitespace-pre-wrap break-all text-[13px] leading-relaxed text-peach">
            {embedCode}
          </code>
        </div>
        <button
          onClick={copyEmbed}
          className="mt-4 rounded-full bg-coral px-5 py-2 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]"
        >
          {copied ? "Copied!" : "Copy snippet"}
        </button>
      </div>

      {/* Widget Preview */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <h2 className="text-[17px] font-semibold text-text-primary">Preview</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          What visitors see when they browse your apartment listing.
        </p>
        <div className="mt-4 relative rounded-xl bg-gradient-to-br from-peach-soft/40 to-sunflower-soft/30 p-8 min-h-[280px] border border-glass-border">
          {/* Fake browser chrome */}
          <div className="flex gap-1.5 mb-6">
            <div className="h-2.5 w-2.5 rounded-full bg-coral/40" />
            <div className="h-2.5 w-2.5 rounded-full bg-sunflower/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-mint/40" />
          </div>
          <div className="h-3 w-48 rounded bg-white/50" />
          <div className="mt-3 h-2 w-64 rounded bg-white/40" />
          <div className="mt-2 h-2 w-56 rounded bg-white/40" />
          <div className="mt-3 h-2 w-40 rounded bg-white/35" />

          {/* Interactive widget */}
          <div className="absolute bottom-4 right-4">
            {widgetOpen ? (
              <div className="w-[260px] rounded-2xl bg-white shadow-xl border border-glass-border overflow-hidden animate-in">
                <div className="bg-gradient-to-r from-coral to-peach px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-white">A reason to walk the block</span>
                  <button onClick={() => setWidgetOpen(false)} className="text-white/70 text-[15px] hover:text-white transition-colors cursor-pointer leading-none">&#8722;</button>
                </div>
                <div className="p-3 space-y-2">
                  <div className="rounded-xl border border-glass-border p-3">
                    <p className="text-[12px] font-semibold text-text-primary">20% off your first meal</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Corner Bistro &middot; Restaurant</p>
                  </div>
                  <div className="rounded-xl border border-glass-border p-3">
                    <p className="text-[12px] font-semibold text-text-primary">Free week trial</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">FitBlock Gym &middot; Fitness</p>
                  </div>
                </div>
                <div className="border-t border-glass-border py-2 text-center text-[10px] text-text-tertiary">Powered by Block &amp; Mortar</div>
              </div>
            ) : (
              <button
                onClick={() => setWidgetOpen(true)}
                className="rounded-full bg-gradient-to-r from-coral to-peach px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-coral/25 transition-transform hover:scale-105 cursor-pointer"
              >
                A reason to walk the block
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-text-tertiary">
          Click the {widgetOpen ? "minimize button" : "tab"} to {widgetOpen ? "collapse" : "expand"} the widget
        </p>
      </div>
    </div>
  );
}

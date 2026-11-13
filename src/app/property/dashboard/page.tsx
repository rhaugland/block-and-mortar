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
    widgetLastPing: string | null;
    widgetStyle: { primaryColor: string; accentColor: string; fontFamily: string; borderRadius: string } | null;
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
  const [locations, setLocations] = useState<{ id: string; name: string; address: string; city: string; state: string; zip: string }[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [styleTokens, setStyleTokens] = useState<{ primaryColor: string; accentColor: string; fontFamily: string; borderRadius: string } | null>(null);
  const [styleSaved, setStyleSaved] = useState(false);

  useEffect(() => {
    fetch("/api/property/dashboard")
      .then((r) => {
        if (!r.ok) { window.location.href = "/property/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((d) => { setData(d); setWidgetLive(d.property.widgetEnabled); if (d.property.widgetStyle) setStyleTokens(d.property.widgetStyle); })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/property/locations")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setLocations(d.locations); })
      .catch(() => {});
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

  const addLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingLocation(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/property/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("locName"),
          address: fd.get("locAddress"),
          city: fd.get("locCity"),
          state: fd.get("locState"),
          zip: fd.get("locZip"),
        }),
      });
      if (res.ok) {
        const { location } = await res.json();
        setLocations((prev) => [...prev, location]);
        setShowAddLocation(false);
        (e.target as HTMLFormElement).reset();
      }
    } catch { /* ignore */ }
    setAddingLocation(false);
  };

  const removeLocation = async (id: string) => {
    try {
      const res = await fetch("/api/property/locations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch { /* ignore */ }
  };

  const analyzeSite = async () => {
    if (!siteUrl) return;
    setAnalyzing(true);
    setStyleSaved(false);
    try {
      const res = await fetch("/api/property/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      if (res.ok) {
        const { tokens } = await res.json();
        setStyleTokens(tokens);
      }
    } catch { /* ignore */ }
    setAnalyzing(false);
  };

  const saveStyle = async () => {
    if (!styleTokens) return;
    try {
      const res = await fetch("/api/property/widget-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(styleTokens),
      });
      if (res.ok) {
        setStyleSaved(true);
        setTimeout(() => setStyleSaved(false), 2000);
      }
    } catch { /* ignore */ }
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

      {/* Locations */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold text-text-primary">Your locations</h2>
            <p className="mt-0.5 text-[13px] text-text-secondary">
              The widget shows offers near all of your locations. One embed code covers them all.
            </p>
          </div>
          <button
            onClick={() => setShowAddLocation(!showAddLocation)}
            className="rounded-full bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {showAddLocation ? "Cancel" : "+ Add location"}
          </button>
        </div>

        {/* Location list */}
        <div className="mt-5 space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-white/60 px-4 py-3">
              <div>
                <p className="text-[14px] font-medium text-text-primary">{loc.name}</p>
                <p className="text-[12px] text-text-tertiary">{loc.address}, {loc.city}, {loc.state} {loc.zip}</p>
              </div>
              {locations.length > 1 && (
                <button
                  onClick={() => removeLocation(loc.id)}
                  className="text-[12px] text-text-tertiary hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add location form */}
        {showAddLocation && (
          <form onSubmit={addLocation} className="mt-4 rounded-xl border border-sunflower/20 bg-sunflower-soft/30 p-4 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Location name</label>
              <input name="locName" required placeholder="e.g. The Lofts at Maple Grove" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">Street address</label>
              <input name="locAddress" required className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" />
            </div>
            <div className="grid grid-cols-[1fr_70px_90px] gap-2">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">City</label>
                <input name="locCity" required className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">State</label>
                <input name="locState" required maxLength={2} placeholder="MN" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">ZIP</label>
                <input name="locZip" required className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingLocation}
              className="rounded-lg bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {addingLocation ? "Adding..." : "Add location"}
            </button>
          </form>
        )}
      </div>

      {/* Widget Status */}
      {(() => {
        const installed = data.property.widgetLastPing != null;
        const recentPing = installed && (Date.now() - new Date(data.property.widgetLastPing!).getTime()) < 24 * 60 * 60 * 1000;

        let dot: string, label: string, desc: string;
        if (!widgetLive) {
          dot = "bg-text-tertiary";
          label = "Widget is off";
          desc = "The widget is hidden from your website visitors";
        } else if (recentPing) {
          dot = "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]";
          label = "Widget is live";
          desc = "Installed and showing on your website";
        } else if (installed) {
          dot = "bg-sunflower shadow-[0_0_6px_rgba(251,191,36,0.4)]";
          label = "Widget installed — no recent activity";
          desc = "The widget was detected but hasn\u2019t loaded in the last 24 hours";
        } else {
          dot = "bg-sunflower shadow-[0_0_6px_rgba(251,191,36,0.4)]";
          label = "Widget enabled — not yet installed";
          desc = "Embed the code snippet below on your website to go live";
        }

        return (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-glass-border bg-white/70 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              <div>
                <p className="text-[15px] font-medium text-text-primary">{label}</p>
                <p className="text-[12px] text-text-tertiary">{desc}</p>
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
        );
      })()}

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

      {/* Style Customization */}
      <div className="mt-10 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <h2 className="text-[17px] font-semibold text-text-primary">
          Match your website&apos;s style
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Paste your website URL and we&apos;ll analyze its design to customize the widget colors, fonts, and shape.
        </p>

        <div className="mt-4 flex gap-3">
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://your-apartment-site.com"
            className="flex-1 rounded-xl border border-glass-border bg-white/80 px-4 py-2.5 text-[14px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
          />
          <button
            onClick={analyzeSite}
            disabled={analyzing || !siteUrl}
            className="rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {styleTokens && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-glass-border bg-white/60 p-3">
                <p className="text-[11px] font-medium text-text-tertiary mb-2">Primary</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg shadow-sm border border-glass-border" style={{ background: styleTokens.primaryColor }} />
                  <span className="text-[12px] text-text-secondary font-mono">{styleTokens.primaryColor}</span>
                </div>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/60 p-3">
                <p className="text-[11px] font-medium text-text-tertiary mb-2">Accent</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg shadow-sm border border-glass-border" style={{ background: styleTokens.accentColor }} />
                  <span className="text-[12px] text-text-secondary font-mono">{styleTokens.accentColor}</span>
                </div>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/60 p-3">
                <p className="text-[11px] font-medium text-text-tertiary mb-2">Font</p>
                <p className="text-[13px] text-text-primary font-medium truncate" style={{ fontFamily: styleTokens.fontFamily }}>{styleTokens.fontFamily}</p>
              </div>
              <div className="rounded-xl border border-glass-border bg-white/60 p-3">
                <p className="text-[11px] font-medium text-text-tertiary mb-2">Corners</p>
                <p className="text-[13px] text-text-primary font-medium">{styleTokens.borderRadius}</p>
              </div>
            </div>
            <button
              onClick={saveStyle}
              className="mt-4 rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {styleSaved ? "Saved!" : "Apply to widget"}
            </button>
          </div>
        )}
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

          {/* Interactive widget — uses custom colors if set */}
          <div className="absolute bottom-4 right-4">
            {widgetOpen ? (
              <div className="w-[260px] bg-white shadow-xl border border-glass-border overflow-hidden" style={{ borderRadius: styleTokens?.borderRadius || "16px" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${styleTokens?.primaryColor || "#ff6b5b"}, ${styleTokens?.accentColor || "#fb923c"})` }}>
                  <span className="text-[13px] font-semibold text-white" style={{ fontFamily: styleTokens?.fontFamily }}>A reason to walk the block</span>
                  <button onClick={() => setWidgetOpen(false)} className="text-white/70 text-[15px] hover:text-white transition-colors cursor-pointer leading-none">&#8722;</button>
                </div>
                <div className="p-3 space-y-2" style={{ fontFamily: styleTokens?.fontFamily }}>
                  <div className="border border-glass-border p-3" style={{ borderRadius: `max(${parseInt(styleTokens?.borderRadius || "16") - 4}px, 6px)` }}>
                    <p className="text-[12px] font-semibold text-text-primary">20% off your first meal</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">Corner Bistro &middot; Restaurant</p>
                  </div>
                  <div className="border border-glass-border p-3" style={{ borderRadius: `max(${parseInt(styleTokens?.borderRadius || "16") - 4}px, 6px)` }}>
                    <p className="text-[12px] font-semibold text-text-primary">Free week trial</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">FitBlock Gym &middot; Fitness</p>
                  </div>
                </div>
                <div className="border-t border-glass-border py-2 text-center text-[10px] text-text-tertiary">Powered by Block &amp; Mortar</div>
              </div>
            ) : (
              <button
                onClick={() => setWidgetOpen(true)}
                className="rounded-full px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${styleTokens?.primaryColor || "#ff6b5b"}, ${styleTokens?.accentColor || "#fb923c"})` }}
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

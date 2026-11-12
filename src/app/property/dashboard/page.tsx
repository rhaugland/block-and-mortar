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
        if (!r.ok) {
          window.location.href = "/property/login";
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-stone-500">Loading...</p>
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
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{data.property.name}</h1>
        <p className="text-sm text-stone-500">
          {data.property.address}, {data.property.city}, {data.property.state} {data.property.zip}
        </p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Impressions</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">
            {data.stats.totalImpressions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Total Clicks</p>
          <p className="mt-1 text-3xl font-bold text-stone-900">
            {data.stats.totalClicks.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">Estimated Revenue</p>
          <p className="mt-1 text-3xl font-bold text-green-700">
            ${(data.stats.revenueCents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Embed Widget */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Embed Widget</h2>
        <p className="mt-1 text-sm text-stone-500">
          Add this script tag to your apartment website to show neighborhood perks to visitors.
        </p>
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-900 p-4">
          <code className="block whitespace-pre-wrap break-all text-sm text-green-400">
            {embedCode}
          </code>
        </div>
        <button
          onClick={copyEmbed}
          className="mt-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      {/* Widget Preview */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Widget Preview</h2>
        <p className="mt-1 text-sm text-stone-500">
          This is what visitors to your website will see.
        </p>
        <div className="mt-3 relative rounded-lg border border-stone-200 bg-white p-6 min-h-[200px]">
          <div className="absolute bottom-4 right-4 w-72">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <span className="text-lg">&#127968;</span>
                <span className="font-semibold text-sm">Neighborhood Perks</span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="rounded-md bg-white p-3 shadow-sm border border-amber-100">
                  <p className="text-xs font-medium text-stone-900">20% off your first meal</p>
                  <p className="text-xs text-stone-500">Local Restaurant</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm border border-amber-100">
                  <p className="text-xs font-medium text-stone-900">Free week trial</p>
                  <p className="text-xs text-stone-500">Neighborhood Gym</p>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-stone-400">Powered by Block &amp; Mortar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface BusinessRow {
  id: string;
  name: string;
  category: string;
  spentCents: number;
  clickCount: number;
}

interface PropertyPayout {
  propertyId: string;
  propertyName: string;
  clickCount: number;
  revSharePct: number;
  owedCents: number;
}

interface PayoutRecord {
  id: string;
  propertyId: string;
  property: { name: string; email: string };
  amountCents: number;
  clickCount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  failReason: string | null;
  tremendousLink: string | null;
  createdAt: string;
}

interface Stats {
  totalRevenueCents: number;
  totalOwedCents: number;
  netRevenueCents: number;
}

type OpenPanel = "revenue" | "payouts" | "history" | null;

export default function AdminRevenue() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [unpaid, setUnpaid] = useState<PropertyPayout[]>([]);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<OpenPanel>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ results: { propertyName: string; amountCents: number; status: string; error?: string }[] } | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/admin/overview").then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      }),
      fetch("/api/admin/payouts").then((r) => r.json()),
    ])
      .then(([overview, payoutData]) => {
        setStats(overview.stats);
        setBusinesses(overview.businesses);
        setUnpaid(overview.propertyPayouts);
        setHistory(payoutData.payouts || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSendPayouts = async () => {
    if (!confirm("Send Visa gift card payouts to all properties with unpaid balances?")) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setSendResult(data);
      fetchData();
    } catch {
      alert("Failed to send payouts. Check console for details.");
    } finally {
      setSending(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const toggle = (panel: OpenPanel) => setOpen((prev) => prev === panel ? null : panel);

  const totalPaidCents = history.filter((p) => p.status === "sent").reduce((sum, p) => sum + p.amountCents, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Revenue</h1>
        <p className="mt-1 text-[15px] text-text-secondary">Platform financials at a glance.</p>
      </div>

      {/* Three cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {/* Revenue */}
        <button
          onClick={() => toggle("revenue")}
          className={`rounded-2xl border p-6 text-left backdrop-blur-sm transition-all hover:shadow-lg ${
            open === "revenue"
              ? "border-sunflower/40 bg-sunflower-soft/80 shadow-md"
              : "border-sunflower/20 bg-sunflower-soft/60 hover:border-sunflower/30"
          }`}
        >
          <p className="text-[13px] font-medium text-text-tertiary">Revenue</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] text-text-primary">
            ${(stats.totalRevenueCents / 100).toFixed(2)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <span>{businesses.length} businesses</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open === "revenue" ? "rotate-180" : ""}`}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </p>
        </button>

        {/* Payouts */}
        <button
          onClick={() => toggle("payouts")}
          className={`rounded-2xl border p-6 text-left backdrop-blur-sm transition-all hover:shadow-lg ${
            open === "payouts"
              ? "border-coral/30 bg-coral-soft/70 shadow-md"
              : "border-coral/15 bg-coral-soft/50 hover:border-coral/25"
          }`}
        >
          <p className="text-[13px] font-medium text-text-tertiary">Payouts</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] text-text-primary">
            ${((totalPaidCents + stats.totalOwedCents) / 100).toFixed(2)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <span>${(totalPaidCents / 100).toFixed(2)} paid &middot; ${(stats.totalOwedCents / 100).toFixed(2)} unpaid</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open === "payouts" ? "rotate-180" : ""}`}>
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </p>
        </button>

        {/* Profit */}
        <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-text-tertiary">Profit</p>
          <p className="mt-1 text-[32px] font-semibold tracking-[-0.02em] bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
            ${((stats.totalRevenueCents - totalPaidCents - stats.totalOwedCents) / 100).toFixed(2)}
          </p>
          <p className="mt-2 text-[12px] text-text-tertiary">Revenue minus all payouts</p>
        </div>
      </div>

      {/* Revenue breakdown */}
      {open === "revenue" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-sunflower/20 bg-white/70 backdrop-blur-sm">
          <div className="border-b border-glass-border bg-sunflower-soft/30 px-5 py-3">
            <p className="text-[13px] font-semibold text-text-primary">Revenue by Business</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Claims</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {businesses
                .filter((b) => b.spentCents > 0)
                .sort((a, b) => b.spentCents - a.spentCents)
                .map((b) => (
                  <tr key={b.id} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{b.name}</td>
                    <td className="px-5 py-3 text-[12px] text-text-secondary">{b.category}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-text-primary">{b.clickCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-medium text-text-primary">${(b.spentCents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-[12px] text-text-secondary">
                      {stats.totalRevenueCents > 0 ? ((b.spentCents / stats.totalRevenueCents) * 100).toFixed(0) : 0}%
                    </td>
                  </tr>
                ))}
              {businesses.filter((b) => b.spentCents > 0).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[14px] text-text-tertiary">No revenue yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts breakdown */}
      {open === "payouts" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-coral/15 bg-white/70 backdrop-blur-sm">
          <div className="border-b border-glass-border bg-coral-soft/20 px-5 py-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-primary">Payouts by Property</p>
            <button
              onClick={() => toggle("history")}
              className="text-[12px] font-medium text-coral hover:underline"
            >
              View payout history
            </button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3 text-right">Claims</th>
                <th className="px-5 py-3 text-right">Rev Share</th>
                <th className="px-5 py-3 text-right">Amount Owed</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {unpaid
                .sort((a, b) => b.owedCents - a.owedCents)
                .map((p) => (
                  <tr key={p.propertyId} className="border-b border-glass-border/50 last:border-0">
                    <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{p.propertyName}</td>
                    <td className="px-5 py-3 text-right text-[13px] text-text-primary">{p.clickCount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-[12px] text-text-secondary">{Math.round(p.revSharePct * 100)}%</td>
                    <td className="px-5 py-3 text-right text-[13px] font-medium text-coral">${(p.owedCents / 100).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unpaid
                      </span>
                    </td>
                  </tr>
                ))}
              {unpaid.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[14px] text-text-tertiary">All caught up — no payouts owed.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payout history */}
      {open === "history" && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
          <div className="border-b border-glass-border bg-white/40 px-5 py-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-primary">Payout History</p>
            <button onClick={() => toggle("history")} className="text-[12px] text-text-tertiary hover:text-text-primary">&times; Close</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-glass-border bg-white/40 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Property</th>
                <th className="px-5 py-3 text-right">Claims</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id} className="border-b border-glass-border/50 last:border-0">
                  <td className="px-5 py-3 text-[12px] text-text-secondary">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-text-primary">{p.property.name}</td>
                  <td className="px-5 py-3 text-right text-[13px] text-text-primary">{p.clickCount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-[13px] font-medium text-text-primary">${(p.amountCents / 100).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    {p.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Sent
                      </span>
                    ) : p.status === "failed" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600" title={p.failReason || ""}>
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[14px] text-text-tertiary">No payouts sent yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Send result toast */}
      {sendResult && (
        <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-5 backdrop-blur-sm">
          <p className="text-[14px] font-semibold text-text-primary mb-3">Payout Results</p>
          <div className="space-y-2">
            {sendResult.results.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[13px]">
                <span className="text-text-primary">{r.propertyName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-text-secondary">${(r.amountCents / 100).toFixed(2)}</span>
                  {r.status === "sent" ? (
                    <span className="text-emerald-600 font-medium">Sent</span>
                  ) : r.status === "skipped" ? (
                    <span className="text-text-tertiary">Skipped (no claims)</span>
                  ) : r.status === "below_minimum" ? (
                    <span className="text-amber-600">Below $1 minimum</span>
                  ) : (
                    <span className="text-red-600">{r.error || "Failed"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setSendResult(null)} className="mt-3 text-[12px] text-text-tertiary hover:text-text-primary">Dismiss</button>
        </div>
      )}

      {/* Unpaid payouts — always visible */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">Unpaid Payouts</h2>
            <p className="mt-1 text-[13px] text-text-secondary">Properties with outstanding balances.</p>
          </div>
          {unpaid.length > 0 && (
            <button
              onClick={handleSendPayouts}
              disabled={sending}
              className="rounded-xl bg-gradient-to-r from-coral to-peach px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send All Payouts"}
            </button>
          )}
        </div>

        {unpaid.length > 0 ? (
          <>
            <div className="mt-4 space-y-3">
              {unpaid
                .sort((a, b) => b.owedCents - a.owedCents)
                .map((p) => (
                  <div key={p.propertyId} className="flex items-center justify-between rounded-2xl border border-glass-border bg-white/70 px-5 py-4 backdrop-blur-sm">
                    <div>
                      <p className="text-[14px] font-medium text-text-primary">{p.propertyName}</p>
                      <p className="mt-0.5 text-[12px] text-text-tertiary">{p.clickCount} claims &middot; {Math.round(p.revSharePct * 100)}% rev share</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[18px] font-semibold text-coral">${(p.owedCents / 100).toFixed(2)}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unpaid
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 px-5 py-4 backdrop-blur-sm">
              <p className="text-[15px] font-medium text-text-primary">
                Total outstanding: <span className="font-semibold text-coral">${(stats.totalOwedCents / 100).toFixed(2)}</span>
              </p>
              <p className="mt-0.5 text-[12px] text-text-tertiary">Across {unpaid.length} properties &middot; Sent as Visa gift cards via Tremendous</p>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-8 text-center backdrop-blur-sm">
            <p className="text-[14px] text-emerald-600 font-medium">All caught up — no outstanding payouts.</p>
          </div>
        )}
      </div>
    </div>
  );
}

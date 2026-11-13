"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Offer {
  id: string;
  title: string;
  description: string;
  active: boolean;
  budgetCents: number;
  spentCents: number;
  cpcCents: number;
  radiusMiles: number;
  impressions: number;
  clicks: number;
  startsAt: string;
  expiresAt: string | null;
  imageUrl: string | null;
  redemptions: number;
}

const CAT_ICONS: Record<string, string> = {
  "Restaurant": "\u{1F37D}",
  "Cafe": "\u2615",
  "Gym / Fitness": "\u{1F4AA}",
  "Salon / Spa": "\u{1F487}",
  "Retail": "\u{1F6CD}",
  "Services": "\u{1F6E0}",
  "Entertainment": "\u{1F3AE}",
  "Other": "\u2B50",
};

function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function BusinessDashboard() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetCents, setBudgetCents] = useState(0);
  const [spentCents, setSpentCents] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizCategory, setBizCategory] = useState("");
  const [bizLogo, setBizLogo] = useState<string | null>(null);
  const [bizAddress, setBizAddress] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/business/offers").then((r) => {
        if (!r.ok) { window.location.href = "/business/login"; throw new Error("Unauthorized"); }
        return r.json();
      }),
      fetch("/api/business/budget").then((r) => r.json()),
    ])
      .then(([offersData, budgetData]) => {
        setOffers(offersData);
        setBudgetCents(budgetData.budgetCents ?? 0);
        setSpentCents(budgetData.spentCents ?? 0);
        setBudgetInput(((budgetData.budgetCents ?? 0) / 100).toString());
        if (!budgetData.budgetCents) setEditingBudget(true);
        if (budgetData.name) setBizName(budgetData.name);
        if (budgetData.category) setBizCategory(budgetData.category);
        if (budgetData.logoUrl) setBizLogo(budgetData.logoUrl);
        if (budgetData.address) setBizAddress(budgetData.address);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveBudget = async () => {
    const cents = Math.round(parseFloat(budgetInput) * 100);
    if (isNaN(cents) || cents < 0) return;
    setSavingBudget(true);
    try {
      const res = await fetch("/api/business/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetCents: cents }),
      });
      if (res.ok) {
        setBudgetCents(cents);
        setEditingBudget(false);
      }
    } catch {}
    setSavingBudget(false);
  };

  const totalImpressions = offers.reduce((s, o) => s + o.impressions, 0);
  const totalClicks = offers.reduce((s, o) => s + o.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
  const remainingCents = Math.max(0, budgetCents - spentCents);
  const budgetPct = budgetCents > 0 ? Math.min(100, (spentCents / budgetCents) * 100) : 0;
  const budgetDepleted = budgetCents > 0 && spentCents >= budgetCents;
  const catIcon = CAT_ICONS[bizCategory] || "\u2B50";

  const toggleOffer = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/business/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setOffers((prev) => prev.map((o) => o.id === id ? { ...o, active } : o));
      }
    } catch {}
  };

  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [testSent, setTestSent] = useState<string | null>(null);

  const sendTestOffer = async (id: string) => {
    setSendingTest(id);
    setTestSent(null);
    try {
      const res = await fetch("/api/business/test-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: id }),
      });
      if (res.ok) {
        setTestSent(id);
        setTimeout(() => setTestSent(null), 5000);
      }
    } catch {}
    setSendingTest(null);
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("Delete this offer? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/business/offers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
            Your offers
          </h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Track how renters engage with your deals.
          </p>
        </div>
        <Link
          href="/business/dashboard/new-offer"
          className="rounded-full bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-coral/25 active:scale-[0.98]"
        >
          + New Offer
        </Link>
      </div>

      {/* Account Budget */}
      {editingBudget ? (
        <div className="mt-8 rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 p-5 backdrop-blur-sm">
          <p className="text-[13px] font-semibold text-text-primary">Edit budget</p>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-text-tertiary">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-glass-border bg-white/80 py-2.5 pl-8 pr-4 text-[15px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
              />
            </div>
            <button
              onClick={handleSaveBudget}
              disabled={savingBudget}
              className="rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {savingBudget ? "..." : "Save"}
            </button>
            <button
              onClick={() => { setEditingBudget(false); setBudgetInput((budgetCents / 100).toString()); }}
              className="rounded-xl border border-glass-border bg-white/60 px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-all hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex items-center gap-6 rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-5 flex-1">
            <div>
              <p className="text-[11px] font-medium text-text-tertiary">Budget</p>
              <p className="text-[20px] font-semibold tracking-tight text-text-primary">${(budgetCents / 100).toFixed(2)}</p>
            </div>
            <div className="h-8 w-px bg-glass-border" />
            <div>
              <p className="text-[11px] font-medium text-text-tertiary">Spent</p>
              <p className="text-[20px] font-semibold tracking-tight text-text-primary">${(spentCents / 100).toFixed(2)}</p>
            </div>
            {budgetCents > 0 && (
              <>
                <div className="h-8 w-px bg-glass-border" />
                <div className="flex-1 min-w-[80px]">
                  <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                    <span>{Math.round(budgetPct)}% used</span>
                    <span className="font-medium text-coral">{Math.floor(remainingCents / 50)} clicks left</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full transition-all ${budgetDepleted ? "bg-red-400" : "bg-gradient-to-r from-coral to-peach"}`}
                      style={{ width: `${budgetPct}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {budgetDepleted && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-600">
              Depleted
            </span>
          )}
          <button
            onClick={() => setEditingBudget(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
            title="Edit budget"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M10.08 1.92a1.5 1.5 0 012.12 0l.88.88a1.5 1.5 0 010 2.12L5.5 12.5 1 13l.5-4.5 8.58-8.58z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.5 3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Impressions", value: totalImpressions.toLocaleString(), color: "bg-sunflower-soft/60 border-sunflower/20" },
          { label: "Clicks", value: totalClicks.toLocaleString(), color: "bg-coral-soft/50 border-coral/15" },
          { label: "Click rate", value: `${ctr}%`, color: "bg-white/70 border-glass-border" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-5 backdrop-blur-sm ${s.color}`}>
            <p className="text-[13px] font-medium text-text-tertiary">{s.label}</p>
            <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Offers */}
      <div className="mt-10">
        {offers.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-glass-border bg-white/50 py-16 backdrop-blur-sm">
            <p className="text-[15px] text-text-secondary">No offers yet</p>
            <Link
              href="/business/dashboard/new-offer"
              className="mt-3 text-[13px] font-medium text-coral hover:text-peach"
            >
              Create your first offer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => {
              const expired = offer.expiresAt && new Date(offer.expiresAt) < new Date();
              const days = daysLeft(offer.expiresAt);
              const status = budgetDepleted ? "Budget spent" : expired ? "Expired" : offer.active ? "Live" : "Paused";
              const dotColor = budgetDepleted || expired ? "bg-red-400" : offer.active ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]" : "bg-text-tertiary";

              return (
                <div key={offer.id} className="overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm transition-shadow hover:shadow-lg">
                  {/* Widget-style offer card */}
                  <div className="p-4">
                    <div className="rounded-xl border border-black/[0.06] bg-white p-3">
                      {/* Business row */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-amber-50 text-[16px]">
                          {bizLogo || offer.imageUrl ? (
                            <img src={(bizLogo || offer.imageUrl)!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            catIcon
                          )}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-stone-500">{bizName || "Your Business"}</div>
                          <div className="text-[11px] text-stone-400">{bizCategory || "Business"}</div>
                        </div>
                      </div>
                      {/* Title */}
                      <div className="mb-1 text-[14px] font-semibold text-stone-900">{offer.title}</div>
                      {/* Address */}
                      <div className="mb-2 text-[12px] leading-[1.4] text-stone-600">{bizAddress || offer.description}</div>
                      {/* CTA */}
                      <button className="rounded-lg bg-gradient-to-r from-coral to-peach px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm">
                        Get This Perk
                      </button>
                    </div>
                  </div>

                  {/* Stats + Actions bar */}
                  <div className="border-t border-glass-border bg-white/40 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[12px] text-text-tertiary">
                        <span>{offer.impressions.toLocaleString()} views</span>
                        <span>{offer.clicks.toLocaleString()} claims</span>
                        <span>{offer.redemptions.toLocaleString()} redeemed</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {days !== null && (
                          <span className={`text-[11px] font-medium ${days === 0 ? "text-red-500" : days <= 3 ? "text-amber-500" : "text-text-tertiary"}`}>
                            {days === 0 ? "Expired" : `${days}d left`}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
                          <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
                          {status}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="mt-2.5 flex items-center gap-2 border-t border-glass-border pt-2.5">
                      <button
                        onClick={() => toggleOffer(offer.id, !offer.active)}
                        className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                          offer.active
                            ? "border border-glass-border bg-white/60 text-text-secondary hover:bg-white"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {offer.active ? "Pause" : "Resume"}
                      </button>
                      <button
                        onClick={() => sendTestOffer(offer.id)}
                        disabled={sendingTest === offer.id}
                        className="rounded-lg border border-glass-border bg-white/60 px-3 py-1.5 text-[12px] font-medium text-coral transition-all hover:bg-coral-soft/20 disabled:opacity-50"
                      >
                        {sendingTest === offer.id ? "Sending..." : testSent === offer.id ? "Sent!" : "Send Test"}
                      </button>
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        className="rounded-lg border border-glass-border bg-white/60 px-3 py-1.5 text-[12px] font-medium text-red-500 transition-all hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UpcomingBoost {
  id: string;
  date: string;
  offerTitle: string;
  amountCents: number;
}

interface CurrentEstimate {
  platformFeeCents: number;
  clickCents: number;
  clickCount: number;
  boostCents: number;
  totalCents: number;
  periodStart: string;
  upcomingBoosts: UpcomingBoost[];
}

interface Invoice {
  id: string;
  amountCents: number;
  clickCents: number;
  boostCents: number;
  clickCount: number;
  periodStart: string;
  periodEnd: string;
  stripeHostedUrl: string | null;
  status: string;
  failReason: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

interface BillingData {
  hasPaymentMethod: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
  invoices: Invoice[];
  currentEstimate: CurrentEstimate;
}

const PLATFORM_FEE = 25;

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-700",
    void: "bg-stone-100 text-stone-500",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status] || "bg-stone-100 text-stone-500"}`}>
      {status}
    </span>
  );
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [openInvoice, setOpenInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/business/billing")
      .then((r) => {
        if (!r.ok) { window.location.href = "/business/login"; throw new Error(); }
        return r.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddCard = async () => {
    setAddingCard(true);
    try {
      const r = await fetch("/api/business/billing", { method: "POST" });
      const { url } = await r.json();
      if (url) window.location.href = url;
    } catch {}
    setAddingCard(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const est = data?.currentEstimate;
  const paidInvoices = data?.invoices.filter((i) => i.status === "paid") || [];
  const failedInvoices = data?.invoices.filter((i) => i.status === "failed") || [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/business/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Billing</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            ${PLATFORM_FEE}/mo platform fee + pay-per-click, billed monthly.
          </p>
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-text-primary">Payment method</p>
            {data?.hasPaymentMethod ? (
              <p className="mt-1 text-[13px] text-text-secondary">
                <span className="capitalize">{data.cardBrand}</span> ending in {data.cardLast4}
              </p>
            ) : (
              <p className="mt-1 text-[13px] text-text-tertiary">No card on file — add one to activate billing.</p>
            )}
          </div>
          <button
            onClick={handleAddCard}
            disabled={addingCard}
            className="rounded-lg bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          >
            {addingCard ? "Redirecting..." : data?.hasPaymentMethod ? "Update card" : "Add card"}
          </button>
        </div>
      </div>

      {/* Current month estimate */}
      {est && (
        <div className="mt-6 rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-text-primary">Current period estimate</p>
            <span className="text-[12px] text-text-tertiary">
              Since {new Date(est.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">Platform access fee</span>
              <span className="font-medium text-text-primary">{fmt(est.platformFeeCents)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">{est.clickCount} click{est.clickCount !== 1 ? "s" : ""} claimed</span>
              <span className="font-medium text-text-primary">{fmt(est.clickCents)}</span>
            </div>
            {est.boostCents > 0 && (
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-secondary">{est.upcomingBoosts.length} featured boost day{est.upcomingBoosts.length !== 1 ? "s" : ""}</span>
                <span className="font-medium text-text-primary">{fmt(est.boostCents)}</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-sunflower/30 pt-3 text-[15px] font-semibold">
              <span className="text-text-primary">Estimated total</span>
              <span className="text-coral">{fmt(est.totalCents)}</span>
            </div>
          </div>

          {/* Upcoming boosts breakdown */}
          {est.upcomingBoosts.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-sunflower/20 pt-4">
              <p className="mb-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wide">Scheduled boosts</p>
              {est.upcomingBoosts.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                  <div>
                    <p className="text-[12px] font-medium text-text-primary">{b.offerTitle}</p>
                    <p className="text-[11px] text-text-tertiary">
                      {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-coral">{fmt(b.amountCents)}</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-[11px] text-text-tertiary">
            Billed automatically on the first of each month. You&apos;ll receive a summary email.
          </p>
        </div>
      )}

      {/* Failed invoices notice */}
      {failedInvoices.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-[13px] font-semibold text-red-700">Payment failed</p>
          <p className="mt-1 text-[12px] text-red-600">
            {failedInvoices[0].failReason || "An invoice could not be processed."} Please update your payment method.
          </p>
          <button onClick={handleAddCard} className="mt-3 text-[12px] font-semibold text-red-700 underline">
            Update card
          </button>
        </div>
      )}

      {/* Invoice history */}
      <div className="mt-8">
        <p className="mb-3 text-[13px] font-semibold text-text-primary">
          Invoice history
          {paidInvoices.length > 0 && (
            <span className="ml-2 text-[12px] font-normal text-text-tertiary">
              {paidInvoices.length} statement{paidInvoices.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>

        {paidInvoices.length === 0 ? (
          <div className="rounded-2xl border border-glass-border bg-white/60 p-8 text-center">
            <p className="text-[14px] text-text-tertiary">No invoices yet. Your first statement will appear here after billing runs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paidInvoices.map((inv) => {
              const isOpen = openInvoice === inv.id;
              const period = new Date(inv.periodEnd).toLocaleDateString("en-US", { month: "long", year: "numeric" });
              const platformCents = inv.amountCents - inv.clickCents - inv.boostCents;
              const boostDays = inv.boostCents > 0 ? Math.round(inv.boostCents / 2500) : 0;

              return (
                <div key={inv.id} className="rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm overflow-hidden">
                  {/* Row */}
                  <button
                    onClick={() => setOpenInvoice(isOpen ? null : inv.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-text-primary">{period}</p>
                        <StatusBadge status={inv.status} />
                        {inv.emailSentAt && (
                          <span className="text-[10px] text-text-tertiary" title={`Email sent ${new Date(inv.emailSentAt).toLocaleDateString()}`}>
                            ✉
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-text-tertiary">
                        {new Date(inv.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                        {new Date(inv.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-[16px] font-semibold text-text-primary">{fmt(inv.amountCents)}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 16 16" fill="none"
                      className={`shrink-0 text-text-tertiary transition-transform ${isOpen ? "rotate-90" : ""}`}
                    >
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Expanded breakdown */}
                  {isOpen && (
                    <div className="border-t border-glass-border bg-surface/30 px-5 py-4">
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-text-secondary">Platform access fee</span>
                          <span className="text-text-primary">{fmt(Math.max(0, platformCents))}</span>
                        </div>
                        <div className="flex justify-between text-[13px]">
                          <span className="text-text-secondary">{inv.clickCount} click{inv.clickCount !== 1 ? "s" : ""} claimed</span>
                          <span className="text-text-primary">{fmt(inv.clickCents)}</span>
                        </div>
                        {inv.boostCents > 0 && (
                          <div className="flex justify-between text-[13px]">
                            <span className="text-text-secondary">{boostDays} featured boost day{boostDays !== 1 ? "s" : ""}</span>
                            <span className="text-text-primary">{fmt(inv.boostCents)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-glass-border pt-2.5 text-[14px] font-semibold">
                          <span className="text-text-primary">Total</span>
                          <span className="text-coral">{fmt(inv.amountCents)}</span>
                        </div>
                      </div>
                      {inv.stripeHostedUrl && (
                        <a
                          href={inv.stripeHostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-coral hover:text-peach transition-colors"
                        >
                          View invoice on Stripe
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2m0 0H4m6 0v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

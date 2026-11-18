"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Offer {
  id: string;
  title: string;
  active: boolean;
}

interface Boost {
  id: string;
  offerId: string;
  date: string;
  amountCents: number;
  status: string;
  offer: { title: string };
}

export default function BoostPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [rateCents, setRateCents] = useState(2500);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/business/offers").then((r) => r.json()),
      fetch("/api/business/boost").then((r) => r.json()),
    ])
      .then(([offersData, boostData]) => {
        const active = (Array.isArray(offersData) ? offersData : []).filter((o: Offer) => o.active);
        setOffers(active);
        if (active.length > 0) setSelectedOffer(active[0].id);
        setBoosts(boostData.boosts || []);
        setRateCents(boostData.rateCents || 2500);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Generate next 30 days (client-side only)
  const [days, setDays] = useState<string[]>([]);
  const [today, setToday] = useState("");

  useEffect(() => {
    const result: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      result.push(d.toISOString().split("T")[0]);
    }
    setDays(result);
    setToday(new Date().toISOString().split("T")[0]);
  }, []);

  // Which dates already have boosts for the selected offer
  const boostedDates = new Set(
    boosts
      .filter((b) => b.offerId === selectedOffer && b.status === "active")
      .map((b) => b.date.split("T")[0])
  );

  const toggleDate = (date: string) => {
    if (boostedDates.has(date)) return;
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const handleBook = async () => {
    if (!selectedOffer || selectedDates.length === 0) return;
    setBooking(true);
    try {
      const r = await fetch("/api/business/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: selectedOffer, dates: selectedDates }),
      });
      if (r.ok) {
        setBooked(true);
        setSelectedDates([]);
        // Refresh boosts
        const data = await fetch("/api/business/boost").then((r) => r.json());
        setBoosts(data.boosts || []);
        setTimeout(() => setBooked(false), 3000);
      }
    } catch {}
    setBooking(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  const totalCost = selectedDates.length * rateCents;
  const activeBoosts = boosts.filter((b) => b.status === "active" && b.date.split("T")[0] >= today);
  const pastBoosts = boosts.filter((b) => b.date.split("T")[0] < today);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/business/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Boost an Offer</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Pin your offer to the top of the widget for <span className="font-semibold text-coral">${(rateCents / 100).toFixed(0)}/day</span>
          </p>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
          <p className="text-[15px] text-text-tertiary">No active offers to boost.</p>
          <Link href="/business/dashboard/new-offer" className="mt-3 inline-block text-[13px] font-medium text-coral">
            Create an offer first
          </Link>
        </div>
      ) : (
        <>
          {/* Select offer */}
          <div className="rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
            <label className="block text-[12px] font-medium text-text-tertiary mb-2">Which offer to boost?</label>
            <div className="space-y-2">
              {offers.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setSelectedOffer(o.id); setSelectedDates([]); }}
                  className={`w-full rounded-xl px-4 py-3 text-left text-[14px] font-medium transition-all ${
                    selectedOffer === o.id
                      ? "bg-coral/10 text-coral border border-coral/20"
                      : "border border-glass-border bg-white/60 text-text-primary hover:bg-white"
                  }`}
                >
                  {o.title}
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
            <label className="block text-[12px] font-medium text-text-tertiary mb-1">Pick your dates</label>
            <p className="text-[11px] text-text-tertiary mb-4">Select one or more days. Already-boosted days are locked.</p>

            <div className="grid grid-cols-7 gap-1.5">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-[10px] font-medium text-text-tertiary pb-1">{d}</div>
              ))}

              {/* Pad to correct day of week */}
              {(() => {
                const firstDay = new Date(days[0]).getDay();
                return Array.from({ length: firstDay }, (_, i) => (
                  <div key={`pad-${i}`} />
                ));
              })()}

              {days.map((date) => {
                const d = new Date(date + "T12:00:00");
                const isBoosted = boostedDates.has(date);
                const isSelected = selectedDates.includes(date);
                const isToday = date === today;

                return (
                  <button
                    key={date}
                    onClick={() => toggleDate(date)}
                    disabled={isBoosted}
                    className={`relative rounded-lg py-2 text-[13px] font-medium transition-all ${
                      isBoosted
                        ? "bg-coral/15 text-coral cursor-default"
                        : isSelected
                        ? "bg-coral text-white shadow-sm"
                        : "border border-glass-border bg-white/60 text-text-primary hover:bg-white hover:border-coral/30"
                    }`}
                  >
                    {d.getDate()}
                    {isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-current opacity-40" />}
                    {isBoosted && <span className="absolute top-0.5 right-1 text-[8px]">&#9733;</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary + Book */}
          {selectedDates.length > 0 && (
            <div className="mt-6 rounded-2xl border border-coral/20 bg-coral/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">
                    {selectedDates.length} day{selectedDates.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    {selectedDates.sort().map((d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })).join(", ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] font-semibold bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
                    ${(totalCost / 100).toFixed(2)}
                  </p>
                  <p className="text-[11px] text-text-tertiary">${(rateCents / 100).toFixed(0)}/day</p>
                </div>
              </div>
              <button
                onClick={handleBook}
                disabled={booking}
                className="mt-4 w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
              >
                {booking ? "Booking..." : "Book Featured Boost"}
              </button>
            </div>
          )}

          {booked && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center text-[14px] font-medium text-green-700">
              Boost booked! Your offer will be featured on the selected days.
            </div>
          )}

          {/* Active boosts */}
          {activeBoosts.length > 0 && (
            <div className="mt-8">
              <p className="text-[13px] font-medium text-text-tertiary mb-3">Upcoming &amp; Active Boosts</p>
              <div className="space-y-2">
                {activeBoosts.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-white/70 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-text-primary">{b.offer.title}</p>
                      <p className="text-[12px] text-text-tertiary">
                        {new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[11px] font-semibold text-coral">
                      ${(b.amountCents / 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past boosts */}
          {pastBoosts.length > 0 && (
            <div className="mt-6">
              <p className="text-[13px] font-medium text-text-tertiary mb-3">Past Boosts</p>
              <div className="space-y-2">
                {pastBoosts.slice(0, 10).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-glass-border bg-surface/40 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-text-secondary">{b.offer.title}</p>
                      <p className="text-[11px] text-text-tertiary">
                        {new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className="text-[11px] text-text-tertiary">${(b.amountCents / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

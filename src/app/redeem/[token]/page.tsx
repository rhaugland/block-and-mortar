"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface RedemptionData {
  firstName: string;
  offerTitle: string;
  offerDescription: string;
  offerImageUrl: string | null;
  businessName: string;
  businessLogoUrl: string | null;
  businessCategory: string;
  businessAddress: string;
  redeemed: boolean;
  redeemedAt: string | null;
}

export default function RedeemPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fef7ed] via-[#fff7f5] to-[#fef3c7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-[#ff6b5b]" />
      </div>
    }>
      <RedeemContent />
    </Suspense>
  );
}

function RedeemContent() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<RedemptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/redeem/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setRedeemed(d.redeemed);
      })
      .catch(() => setError("This perk could not be found."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      const res = await fetch(`/api/redeem/${token}`, { method: "POST" });
      if (res.status === 409) {
        setRedeemed(true);
        return;
      }
      if (!res.ok) throw new Error("Failed");
      setRedeemed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fef7ed] via-[#fff7f5] to-[#fef3c7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-[#ff6b5b]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fef7ed] via-[#fff7f5] to-[#fef3c7] px-6">
        <div className="text-center">
          <div className="text-[48px]">😕</div>
          <p className="mt-4 text-[17px] font-semibold text-stone-800">{error || "Perk not found"}</p>
          <p className="mt-2 text-[14px] text-stone-500">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fef7ed] via-[#fff7f5] to-[#fef3c7] px-6 py-12">
      <div className="w-full max-w-[400px]">
        {/* Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/[0.08]">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-[#ff6b5b] to-[#fb923c] px-6 py-5">
            <p className="text-[13px] font-medium text-white/80">Your perk from</p>
            <p className="mt-0.5 text-[20px] font-bold text-white">{data.businessName}</p>
          </div>

          <div className="px-6 py-6">
            {/* Business info */}
            <div className="flex items-center gap-3">
              {data.businessLogoUrl ? (
                <img src={data.businessLogoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-[20px]">
                  {data.businessCategory === "Restaurant" ? "🍽" : "⭐"}
                </div>
              )}
              <div>
                <p className="text-[13px] font-semibold text-stone-600">{data.businessName}</p>
                <p className="text-[12px] text-stone-400">{data.businessAddress}</p>
              </div>
            </div>

            {/* Offer */}
            <div className="mt-5 rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
              <p className="text-[18px] font-bold text-stone-900">{data.offerTitle}</p>
              <p className="mt-1 text-[13px] text-stone-500">{data.offerDescription}</p>
            </div>

            {/* Redeem button or redeemed state */}
            {redeemed ? (
              <div className="mt-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M8 16.5l5.5 5.5L24 11" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="mt-3 text-[18px] font-bold text-green-600">Redeemed!</p>
                <p className="mt-1 text-[13px] text-stone-400">
                  {data.redeemedAt
                    ? `Used on ${new Date(data.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`
                    : "Just now"
                  }
                </p>
                <p className="mt-4 text-[12px] text-stone-400">This perk has been used and cannot be redeemed again.</p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="mb-3 text-center text-[13px] text-stone-500">
                  Show this to your server and tap the button below.
                </p>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full rounded-xl bg-gradient-to-r from-[#ff6b5b] to-[#fb923c] py-4 text-[16px] font-bold text-white shadow-lg shadow-[#ff6b5b]/25 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                >
                  {redeeming ? "Redeeming..." : "Redeem Now"}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 py-3 text-center text-[10px] text-stone-400">
            Powered by Block & Mortar
          </div>
        </div>
      </div>
    </div>
  );
}

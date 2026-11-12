"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Gym / Fitness",
  "Salon / Spa",
  "Retail",
  "Services",
  "Entertainment",
  "Other",
];

export default function BusinessSignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      category: fd.get("category"),
      address: fd.get("address"),
      city: fd.get("city"),
      state: fd.get("state"),
      zip: fd.get("zip"),
      contactName: fd.get("contactName"),
      email: fd.get("email"),
      password: fd.get("password"),
      phone: fd.get("phone") || undefined,
      websiteUrl: fd.get("websiteUrl") || undefined,
      lat: 0,
      lng: 0,
    };

    try {
      const res = await fetch("/api/business/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      router.push("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1";

  return (
    <div className="flex min-h-screen items-start justify-center bg-stone-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">List your business</h1>
        <p className="mt-1 text-sm text-stone-500">
          Reach prospective renters in your neighborhood.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className={labelClass}>Business Name *</label>
            <input name="name" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Category *</label>
            <select name="category" required className={inputClass}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Address *</label>
            <input name="address" required className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>City *</label>
              <input name="city" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <select name="state" required className={inputClass}>
                <option value="">--</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>ZIP *</label>
              <input name="zip" required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Contact Name *</label>
            <input name="contactName" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input name="email" type="email" required className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Password *</label>
            <input name="password" type="password" required minLength={8} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" type="tel" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <input name="websiteUrl" type="url" placeholder="https://" className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/business/login" className="font-medium text-amber-600 hover:text-amber-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

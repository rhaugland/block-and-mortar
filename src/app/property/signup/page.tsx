"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function PropertySignup() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"), address: fd.get("address"),
      city: fd.get("city"), state: fd.get("state"), zip: fd.get("zip"),
      contactName: fd.get("contactName"), email: fd.get("email"),
      password: fd.get("password"), websiteUrl: fd.get("websiteUrl") || undefined,
    };

    try {
      const res = await fetch("/api/property/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }
      router.push("/property/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-accent/20 focus:border-accent";
  const label = "block text-[13px] font-medium text-text-secondary mb-1.5";

  return (
    <div className="flex min-h-screen flex-col items-center bg-surface px-4 py-16">
      <div className="mb-10">
        <Logo size="large" />
      </div>
      <div className="w-full max-w-[480px]">
        <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-text-primary">
          Make your neighborhood a selling point
        </h1>
        <p className="mt-2 text-center text-[15px] text-text-secondary">
          Add one line of code. Visitors see local deals.
          You earn revenue on every click.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className={label}>Property name</label>
            <input name="name" required placeholder="e.g. The Lofts at Cedar Lake" className={input} />
          </div>

          <div>
            <label className={label}>Street address</label>
            <input name="address" required className={input} />
          </div>

          <div className="grid grid-cols-[1fr_80px_100px] gap-3">
            <div>
              <label className={label}>City</label>
              <input name="city" required className={input} />
            </div>
            <div>
              <label className={label}>State</label>
              <select name="state" required className={input}>
                <option value="">--</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>ZIP</label>
              <input name="zip" required className={input} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Your name</label>
              <input name="contactName" required className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input name="email" type="email" required className={input} />
            </div>
          </div>

          <div>
            <label className={label}>Password <span className="text-text-tertiary">(8+ characters)</span></label>
            <input name="password" type="password" required minLength={8} className={input} />
          </div>

          <div>
            <label className={label}>Website <span className="text-text-tertiary">(optional)</span></label>
            <input name="websiteUrl" type="url" placeholder="https://" className={input} />
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-text-primary py-3 text-[15px] font-medium text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-text-tertiary">
          Already registered?{" "}
          <Link href="/property/login" className="font-medium text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

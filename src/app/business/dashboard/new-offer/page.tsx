"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

const DURATIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "Custom", value: -1 },
];

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

export default function NewOffer() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [bizName, setBizName] = useState("Your Business");
  const [bizCategory, setBizCategory] = useState("Restaurant");
  const [bizLogo, setBizLogo] = useState<string | null>(null);
  const [bizAddress, setBizAddress] = useState("");
  const [radius, setRadius] = useState("3");
  const [nearbyProperties, setNearbyProperties] = useState<{ id: string; name: string; city: string; state: string; distance: number }[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nearbyTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    fetch("/api/business/budget")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setBizName(d.name);
        if (d.category) setBizCategory(d.category);
        if (d.logoUrl) setBizLogo(d.logoUrl);
        if (d.address) setBizAddress(d.address);
      })
      .catch(() => {});
  }, []);

  // Fetch nearby properties when radius changes (debounced)
  useEffect(() => {
    if (nearbyTimerRef.current) clearTimeout(nearbyTimerRef.current);
    nearbyTimerRef.current = setTimeout(() => {
      const r = parseFloat(radius);
      if (!r || r <= 0) return;
      setLoadingNearby(true);
      fetch(`/api/business/nearby-properties?radius=${r}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setNearbyProperties(data); })
        .catch(() => {})
        .finally(() => setLoadingNearby(false));
    }, 400);
    return () => { if (nearbyTimerRef.current) clearTimeout(nearbyTimerRef.current); };
  }, [radius]);

  const effectiveDuration = isCustom ? (parseInt(customDays) || 0) : duration;

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/business/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const { url } = await res.json();
      setImageUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (isCustom && (!customDays || parseInt(customDays) < 1)) {
      setError("Please enter a valid number of days");
      return;
    }

    setLoading(true);

    const body = {
      title,
      imageUrl: imageUrl || undefined,
      radiusMiles: parseFloat(radius) || 3,
      durationDays: effectiveDuration,
    };

    try {
      const res = await fetch("/api/business/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create offer");
      }
      router.push("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-xl border border-glass-border bg-white/80 px-4 py-3 text-[15px] text-text-primary outline-none transition-shadow placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral";
  const label = "block text-[12px] font-medium text-text-secondary mb-1.5";

  const previewTitle = title || "20% off your first visit";
  const catIcon = CAT_ICONS[bizCategory] || "\u2B50";

  return (
    <div className="relative flex min-h-[calc(100vh-65px)] items-start justify-center px-4 py-10">
      <div className="flex w-full max-w-[960px] gap-8">
        {/* Form */}
        <div className="w-full max-w-[520px] rounded-3xl border border-glass-border bg-white/70 p-8 shadow-xl backdrop-blur-xl sm:p-10">
          {/* Back + Logo */}
          <div className="mb-8 flex items-center gap-4">
            <Link
              href="/business/dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
            <Logo />
          </div>

          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-text-primary">
            Create an offer
          </h1>
          <p className="mt-1.5 text-[15px] text-text-secondary">
            This will appear on apartment websites near your business.
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Headline */}
            <div>
              <label className={label}>Headline</label>
              <input
                name="title"
                required
                placeholder="e.g. 20% off your first visit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={input}
              />
            </div>

            {/* Duration */}
            <div>
              <label className={label}>How long should this run?</label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      if (d.value === -1) {
                        setIsCustom(true);
                      } else {
                        setIsCustom(false);
                        setDuration(d.value);
                      }
                    }}
                    className={`flex-1 rounded-lg py-2.5 text-[13px] font-medium transition-all ${
                      (d.value === -1 && isCustom) || (d.value !== -1 && !isCustom && duration === d.value)
                        ? "bg-coral text-white shadow-sm"
                        : "border border-glass-border bg-white/60 text-text-secondary hover:bg-white"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {isCustom && (
                <div className="mt-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="Number of days"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className={input}
                  />
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className={label}>Image or logo <span className="text-text-tertiary">(optional)</span></label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {imageUrl ? (
                <div className="relative rounded-xl border border-glass-border bg-white/80 p-3">
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    className="h-32 w-full rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-text-tertiary shadow-sm transition-all hover:bg-white hover:text-red-500"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 transition-all ${
                    dragOver
                      ? "border-coral bg-coral-soft/20"
                      : "border-glass-border bg-white/50 hover:border-coral/40 hover:bg-white/70"
                  }`}
                >
                  {uploading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-coral" />
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-text-tertiary">
                        <path d="M11 20l5-5 5 5M16 15v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M27 21.17V24a3 3 0 01-3 3H8a3 3 0 01-3-3v-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 10l-6-6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p className="mt-2 text-[13px] font-medium text-text-secondary">
                        Drag and drop or <span className="text-coral">browse</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">PNG, JPG, or SVG up to 5MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Radius + Nearby Properties */}
            <div className="rounded-2xl border border-sunflower/20 bg-sunflower-soft/30 p-5">
              <p className="text-[14px] font-semibold text-text-primary">Targeting</p>
              <p className="mt-0.5 text-[12px] text-text-tertiary">
                How far from your business should this offer reach?
              </p>
              <div className="mt-4">
                <label className={label}>Radius (miles)</label>
                <input
                  name="radiusMiles"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="25"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className={input}
                />
              </div>

              {/* Nearby apartments */}
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-medium text-text-secondary">
                    Apartments in range
                  </p>
                  {loadingNearby && (
                    <div className="h-3 w-3 animate-spin rounded-full border border-text-tertiary border-t-coral" />
                  )}
                </div>
                {!loadingNearby && nearbyProperties.length === 0 ? (
                  <p className="mt-2 text-[12px] text-text-tertiary">
                    No apartment communities found within {radius} miles. Try increasing your radius.
                  </p>
                ) : (
                  <div className="mt-2 max-h-[180px] space-y-1.5 overflow-y-auto">
                    {nearbyProperties.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-glass-border bg-white/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-text-primary">{p.name}</p>
                          <p className="text-[11px] text-text-tertiary">{p.city}, {p.state}</p>
                        </div>
                        <span className="ml-2 shrink-0 text-[11px] font-medium text-coral">
                          {p.distance} mi
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {!loadingNearby && nearbyProperties.length > 0 && (
                  <p className="mt-2 text-[12px] text-text-secondary">
                    Your offer will appear on <span className="font-semibold text-coral">{nearbyProperties.length} apartment {nearbyProperties.length === 1 ? "site" : "sites"}</span>
                  </p>
                )}
              </div>

              <p className="mt-3 text-[12px] text-text-secondary">
                All clicks are <span className="font-semibold text-coral">$0.50</span> each. Manage your budget from the dashboard.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full rounded-xl bg-coral py-3 text-[15px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish Offer"}
            </button>
          </form>
        </div>

        {/* Live Widget Preview */}
        <div className="hidden w-[340px] shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-[12px] font-medium text-text-tertiary">Live preview</p>

            {previewOpen ? (
              <div style={{ width: 320, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                  {/* Header */}
                  <div className="flex items-center justify-between bg-gradient-to-br from-coral to-peach px-4 py-3.5">
                    <span className="text-[14px] font-bold text-white">A reason to walk the block</span>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="border-none bg-transparent text-[16px] text-white/70 transition-colors hover:text-white"
                    >
                      &#8722;
                    </button>
                  </div>

                  {/* Offer card */}
                  <div className="p-2">
                    <div className="rounded-xl border border-black/[0.06] bg-white p-3 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                      {/* Business info */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-amber-50 text-[16px]">
                          {bizLogo || imageUrl ? (
                            <img src={(bizLogo || imageUrl)!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            catIcon
                          )}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-stone-500">{bizName}</div>
                          <div className="text-[11px] text-stone-400">{bizCategory}</div>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="mb-1 text-[14px] font-semibold text-stone-900">{previewTitle}</div>

                      {/* Address */}
                      <div className="mb-2 text-[12px] leading-[1.4] text-stone-600">{bizAddress || "123 Main St, Your City, ST"}</div>

                      {/* CTA */}
                      <button className="rounded-lg bg-gradient-to-r from-coral to-peach px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-transform hover:scale-[1.03]">
                        Get This Perk
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-black/[0.06] py-2 text-center text-[10px] text-stone-400">
                    Powered by Block &amp; Mortar
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-coral to-peach px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
              >
                A reason to walk the block
              </button>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-text-tertiary">
              This is how your offer will appear inside the widget on apartment websites. The widget style may vary based on each property&apos;s customization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

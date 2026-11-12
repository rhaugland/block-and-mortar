"use client";

import { useState } from "react";

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Fire-and-forget to a support endpoint (or just mailto for now)
    const subject = encodeURIComponent(String(fd.get("subject") || "Support Request"));
    const body = encodeURIComponent(String(fd.get("message") || ""));
    const email = String(fd.get("email") || "");
    window.open(
      `mailto:support@blockandmortar.com?subject=${subject}&body=${body}%0A%0AFrom: ${encodeURIComponent(email)}`,
      "_self"
    );
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  };

  return (
    <>
      {/* Floating support button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-coral to-peach text-white shadow-lg shadow-coral/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-coral/30 active:scale-95"
        aria-label="Customer support"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </button>

      {/* Support panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] rounded-2xl border border-glass-border bg-white shadow-2xl">
          <div className="rounded-t-2xl bg-gradient-to-r from-coral to-peach px-5 py-4">
            <h3 className="text-[15px] font-semibold text-white">Need help?</h3>
            <p className="mt-0.5 text-[12px] text-white/80">We&apos;re here for you.</p>
          </div>

          <div className="p-5">
            {/* Phone */}
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-glass-border bg-sunflower-soft/40 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-peach"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div>
                <p className="text-[11px] font-medium text-text-tertiary">Call us directly</p>
                <a href="tel:6515282737" className="text-[14px] font-semibold text-text-primary hover:text-coral transition-colors">(651) 528-2737</a>
              </div>
            </div>

            {/* Form */}
            {sent ? (
              <div className="rounded-xl bg-green-50 px-4 py-6 text-center">
                <p className="text-[14px] font-medium text-green-700">Message sent!</p>
                <p className="mt-1 text-[12px] text-green-600">We&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Your email"
                    className="w-full rounded-lg border border-glass-border bg-surface px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <input
                    name="subject"
                    required
                    placeholder="Subject"
                    className="w-full rounded-lg border border-glass-border bg-surface px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    placeholder="How can we help?"
                    className="w-full resize-none rounded-lg border border-glass-border bg-surface px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-coral py-2.5 text-[13px] font-medium text-white shadow-md shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

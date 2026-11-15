"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  name: string;
  email: string;
  role: string;
  subject: string;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "replied" | "closed">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTickets = () => {
    fetch("/api/admin/support")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((data) => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/admin/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, reply: replyText }),
      });
      if (r.ok) {
        setReplyingId(null);
        setReplyText("");
        fetchTickets();
      }
    } catch {}
    setSending(false);
  };

  const filtered = tickets.filter((t) => filter === "all" || t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Support</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            {openCount > 0 ? `${openCount} open ticket${openCount > 1 ? "s" : ""} need${openCount === 1 ? "s" : ""} a response` : "All caught up!"}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-1.5">
        {(["all", "open", "replied", "closed"] as const).map((f) => {
          const count = f === "all" ? tickets.length : tickets.filter((t) => t.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                filter === f
                  ? "bg-coral/10 text-coral"
                  : "text-text-secondary hover:bg-white/60 hover:text-text-primary"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-[11px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tickets */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <p className="text-[15px] text-text-tertiary">No {filter === "all" ? "" : filter} tickets yet.</p>
          </div>
        )}

        {filtered.map((t) => {
          const isExpanded = expandedId === t.id;
          const isReplying = replyingId === t.id;

          return (
            <div
              key={t.id}
              className="rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm transition-all hover:shadow-sm"
            >
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                {/* Status dot */}
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  t.status === "open" ? "bg-coral" : t.status === "replied" ? "bg-green-500" : "bg-slate-400"
                }`} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-text-primary">{t.subject}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      t.role === "property" ? "bg-blue-50 text-blue-600" : t.role === "business" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {t.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    {t.name} &middot; {t.email} &middot; {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>

                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`shrink-0 text-text-tertiary transition-transform ${isExpanded ? "rotate-180" : ""}`}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-glass-border px-5 py-4">
                  {/* Original message */}
                  <div className="rounded-xl bg-surface/60 px-4 py-3">
                    <p className="text-[12px] font-medium text-text-tertiary mb-1">Message</p>
                    <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{t.message}</p>
                  </div>

                  {/* Existing reply */}
                  {t.reply && (
                    <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[12px] font-medium text-green-700">Your reply</p>
                        {t.repliedAt && (
                          <span className="text-[11px] text-green-500">
                            {new Date(t.repliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-green-900 leading-relaxed whitespace-pre-wrap">{t.reply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {t.status !== "closed" && !isReplying && (
                    <button
                      onClick={() => { setReplyingId(t.id); setReplyText(""); }}
                      className="mt-3 rounded-lg bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                      {t.reply ? "Reply Again" : "Reply"}
                    </button>
                  )}

                  {isReplying && (
                    <div className="mt-3 space-y-2.5">
                      <textarea
                        autoFocus
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="w-full resize-none rounded-xl border border-glass-border bg-white px-4 py-3 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          disabled={sending || !replyText.trim()}
                          onClick={() => handleReply(t.id)}
                          className="rounded-lg bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                        >
                          {sending ? "Sending..." : "Send Reply"}
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(""); }}
                          className="rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

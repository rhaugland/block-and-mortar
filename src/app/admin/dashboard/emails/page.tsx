"use client";

import { useEffect, useState } from "react";

interface Email {
  id: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compose form
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fetchEmails = () => {
    fetch("/api/admin/emails")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((data) => setEmails(data.emails || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmails(); }, []);

  const handleSend = async () => {
    if (!toEmail || !subject || !body) return;
    setSending(true);
    try {
      const r = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, toName, subject, body }),
      });
      if (r.ok) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setComposing(false);
          setToEmail("");
          setToName("");
          setSubject("");
          setBody("");
          fetchEmails();
        }, 2000);
      }
    } catch {}
    setSending(false);
  };

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
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Emails</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            Send outreach from ryan@blockandmortar.co
          </p>
        </div>
        {!composing && (
          <button
            onClick={() => setComposing(true)}
            className="rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98]"
          >
            Compose
          </button>
        )}
      </div>

      {/* Compose panel */}
      {composing && (
        <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-semibold text-text-primary">New Email</h2>
            <button
              onClick={() => { setComposing(false); setToEmail(""); setToName(""); setSubject(""); setBody(""); }}
              className="text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>

          {sent ? (
            <div className="rounded-xl bg-green-50 px-4 py-8 text-center">
              <p className="text-[15px] font-medium text-green-700">Email sent!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">To (email)</label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="prospect@example.com"
                    className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">Name (optional)</label>
                  <input
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-tertiary mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Quick intro from Block & Mortar"
                  className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-tertiary mb-1">Message</label>
                <textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full resize-none rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-text-tertiary">
                  Sending as <span className="font-medium text-text-secondary">ryan@blockandmortar.co</span> &middot; replies go to your inbox
                </p>
                <button
                  disabled={sending || !toEmail || !subject || !body}
                  onClick={handleSend}
                  className="rounded-lg bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Email"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sent emails */}
      <div className="mt-6">
        <p className="text-[13px] font-medium text-text-tertiary mb-3">
          Sent &middot; {emails.length} email{emails.length !== 1 ? "s" : ""}
        </p>

        {emails.length === 0 && !composing && (
          <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <p className="text-[15px] text-text-tertiary">No emails sent yet.</p>
            <button
              onClick={() => setComposing(true)}
              className="mt-3 text-[13px] font-medium text-coral hover:text-peach transition-colors"
            >
              Send your first one
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {emails.map((e) => {
            const isExpanded = expandedId === e.id;
            return (
              <div key={e.id} className="rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm transition-all hover:shadow-sm">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${e.status === "sent" ? "bg-green-500" : "bg-red-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-text-primary">{e.subject}</p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-text-tertiary">
                      To: {e.toName ? `${e.toName} (${e.toEmail})` : e.toEmail} &middot; {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`shrink-0 text-text-tertiary transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-glass-border px-5 py-4">
                    <div className="rounded-xl bg-surface/60 px-4 py-3">
                      <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{e.body}</p>
                    </div>
                    {e.status === "failed" && (
                      <p className="mt-2 text-[12px] text-red-500 font-medium">Failed to send</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

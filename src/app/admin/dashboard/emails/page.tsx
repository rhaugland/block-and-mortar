"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface SentEmail {
  id: string;
  toEmail: string;
  toFirstName: string | null;
  toLastName: string | null;
  subject: string;
  body: string;
  bodyHtml: string | null;
  status: string;
  createdAt: string;
}

interface ReceivedEmail {
  id: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  read: boolean;
  createdAt: string;
}

export default function AdminEmailsPage() {
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [received, setReceived] = useState<ReceivedEmail[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sent" | "received">("received");
  const [composing, setComposing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compose form
  const [toEmail, setToEmail] = useState("");
  const [toFirstName, setToFirstName] = useState("");
  const [toLastName, setToLastName] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchEmails = useCallback(() => {
    fetch("/api/admin/emails")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((data) => {
        setSent(data.sent || []);
        setReceived(data.received || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const markRead = async (emailId: string) => {
    await fetch("/api/admin/emails/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId }),
    });
    setReceived((prev) => prev.map((e) => e.id === emailId ? { ...e, read: true } : e));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const execCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const insertMergeTag = (tag: string) => {
    document.execCommand("insertText", false, tag);
    editorRef.current?.focus();
  };

  const handleSend = async () => {
    const bodyHtml = editorRef.current?.innerHTML || "";
    if (!toEmail || !subject || !bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, toFirstName, toLastName, subject, bodyHtml }),
      });
      if (r.ok) {
        setSentSuccess(true);
        setTimeout(() => {
          setSentSuccess(false);
          setComposing(false);
          setToEmail("");
          setToFirstName("");
          setToLastName("");
          setSubject("");
          if (editorRef.current) editorRef.current.innerHTML = "";
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
            ryan@blockandmortar.co
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
              onClick={() => { setComposing(false); setToEmail(""); setToFirstName(""); setToLastName(""); setSubject(""); if (editorRef.current) editorRef.current.innerHTML = ""; }}
              className="text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
          </div>

          {sentSuccess ? (
            <div className="rounded-xl bg-green-50 px-4 py-8 text-center">
              <p className="text-[15px] font-medium text-green-700">Email sent!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">Email</label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="prospect@example.com"
                    className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">First name</label>
                  <input
                    value={toFirstName}
                    onChange={(e) => setToFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral"
                  />
                </div>
                <div className="w-36">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">Last name</label>
                  <input
                    value={toLastName}
                    onChange={(e) => setToLastName(e.target.value)}
                    placeholder="Smith"
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-medium text-text-tertiary">Message</label>
                  <div className="flex items-center gap-1">
                    {/* Merge tags */}
                    <button
                      onClick={() => insertMergeTag("{{first_name}}")}
                      title="Insert first name"
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-coral bg-coral/10 hover:bg-coral/20 transition-colors"
                    >
                      {"{{first_name}}"}
                    </button>
                    <button
                      onClick={() => insertMergeTag("{{last_name}}")}
                      title="Insert last name"
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-coral bg-coral/10 hover:bg-coral/20 transition-colors"
                    >
                      {"{{last_name}}"}
                    </button>
                    <div className="mx-1 h-4 w-px bg-glass-border" />
                    {/* Formatting toolbar */}
                    <button onClick={() => execCommand("bold")} title="Bold" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 2.5h4a2.5 2.5 0 010 5H3.5V2.5zM3.5 7.5h5a2.5 2.5 0 010 5H3.5V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => execCommand("italic")} title="Italic" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 12.5h3M5.5 1.5h3M8.5 1.5l-3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => { const url = prompt("Link URL:"); if (url) execCommand("createLink", url); }} title="Insert link" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 8l2-2m-2.5-1.5L7 3a2.828 2.828 0 014 4l-1.5 1.5m-4 0L4 10a2.828 2.828 0 01-4-4l1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => execCommand("insertUnorderedList")} title="Bullet list" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3h7M5 7h7M5 11h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="2.5" cy="3" r="1" fill="currentColor"/><circle cx="2.5" cy="7" r="1" fill="currentColor"/><circle cx="2.5" cy="11" r="1" fill="currentColor"/></svg>
                    </button>
                  </div>
                </div>

                {/* Rich text editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[200px] w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral [&_a]:text-coral [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  data-placeholder="Write your message... Use {{first_name}} or {{last_name}} for personalization."
                  style={{ whiteSpace: "pre-wrap" }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-text-tertiary">
                  Sending as <span className="font-medium text-text-secondary">ryan@blockandmortar.co</span>
                </p>
                <button
                  disabled={sending || !toEmail || !subject}
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

      {/* Sent / Received toggle */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("received")}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === "received" ? "bg-coral/10 text-coral" : "text-text-secondary hover:bg-white/60 hover:text-text-primary"
            }`}
          >
            Received
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("sent")}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === "sent" ? "bg-coral/10 text-coral" : "text-text-secondary hover:bg-white/60 hover:text-text-primary"
            }`}
          >
            Sent
            <span className="ml-1.5 text-[11px] opacity-60">{sent.length}</span>
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="mt-4 space-y-2.5">
        {tab === "received" && received.length === 0 && (
          <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <p className="text-[15px] text-text-tertiary">No replies received yet.</p>
            <p className="mt-1 text-[12px] text-text-tertiary">When someone replies to your outreach, it will show up here.</p>
          </div>
        )}

        {tab === "sent" && sent.length === 0 && (
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

        {/* Received emails */}
        {tab === "received" && received.map((e) => {
          const isExpanded = expandedId === e.id;
          return (
            <div key={e.id} className={`rounded-2xl border backdrop-blur-sm transition-all hover:shadow-sm ${!e.read ? "border-coral/20 bg-white/80" : "border-glass-border bg-white/70"}`}>
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : e.id);
                  if (!e.read) markRead(e.id);
                }}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                {!e.read && <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-coral" />}
                {e.read && <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300" />}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] ${!e.read ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>{e.subject}</p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    From: {e.fromName ? `${e.fromName} (${e.fromEmail})` : e.fromEmail} &middot; {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
                  {e.bodyHtml ? (
                    <div className="rounded-xl bg-surface/60 px-4 py-3 text-[13px] text-text-primary leading-relaxed [&_a]:text-coral [&_a]:underline" dangerouslySetInnerHTML={{ __html: e.bodyHtml }} />
                  ) : (
                    <div className="rounded-xl bg-surface/60 px-4 py-3">
                      <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{e.bodyText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Sent emails */}
        {tab === "sent" && sent.map((e) => {
          const isExpanded = expandedId === e.id;
          const displayName = [e.toFirstName, e.toLastName].filter(Boolean).join(" ");
          return (
            <div key={e.id} className="rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm transition-all hover:shadow-sm">
              <button
                onClick={() => setExpandedId(isExpanded ? null : e.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${e.status === "sent" ? "bg-green-500" : "bg-red-400"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-text-primary">{e.subject}</p>
                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                    To: {displayName ? `${displayName} (${e.toEmail})` : e.toEmail} &middot; {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
                  {e.bodyHtml ? (
                    <div className="rounded-xl bg-surface/60 px-4 py-3 text-[13px] text-text-primary leading-relaxed [&_a]:text-coral [&_a]:underline" dangerouslySetInnerHTML={{ __html: e.bodyHtml }} />
                  ) : (
                    <div className="rounded-xl bg-surface/60 px-4 py-3">
                      <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{e.body}</p>
                    </div>
                  )}
                  {e.status === "failed" && (
                    <p className="mt-2 text-[12px] text-red-500 font-medium">Failed to send</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Placeholder style for contentEditable */}
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

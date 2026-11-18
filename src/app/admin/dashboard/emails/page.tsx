"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";

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

interface ThreadMessage {
  id: string;
  direction: "sent" | "received";
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  read: boolean;
  status?: string;
  createdAt: string;
}

interface Thread {
  email: string;
  name: string;
  messages: ThreadMessage[];
  lastActivity: string;
  hasUnread: boolean;
  unreadCount: number;
}

export default function AdminEmailsPage() {
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [received, setReceived] = useState<ReceivedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [openThreadEmail, setOpenThreadEmail] = useState<string | null>(null);

  // Compose form
  const [toEmail, setToEmail] = useState("");
  const [toFirstName, setToFirstName] = useState("");
  const [toLastName, setToLastName] = useState("");
  const [subject, setSubject] = useState("");
  const [contactType, setContactType] = useState<"custom" | "apartment" | "business">("custom");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const [replySending, setReplySending] = useState(false);

  const APARTMENT_SUBJECT = "Local perks widget for your apartment website";
  const APARTMENT_BODY = `<p>Hi {{first_name}},</p>
<p>We're building a website widget, similar to the "Chat with us" or "Schedule a tour" tools on your site, that lets local restaurants and businesses offer discounts to prospective renters while they browse your apartment page.</p>
<p>Most rewards programs start after move-in. We want to reach renters earlier and encourage them to explore the neighborhood while they're still deciding where to live.</p>
<p>Businesses pay us per click, and we share 25% of that revenue with you for clicks that come from your website. There's no cost to you.</p>
<p>If you have 15 minutes in the next few weeks, I'd love to tell you more.</p>
<p>Best,<br/>Ryan</p>`;

  const BUSINESS_SUBJECT = "Pilot partner invite — local apartment widget";
  const BUSINESS_BODY = `<p>Hi {{first_name}},</p>
<p>We're building a widget for local apartment websites that offers prospective renters a discount for visiting nearby businesses while they search for a place to live.</p>
<p>Renters browsing online often have no reason to visit the neighborhood. We want to give them one: a chance to experience a local spot like yours and, ideally, become a regular once they move in.</p>
<p>Most rewards programs target residents who have already moved in. We're focused on people who are still looking and open to exploring the area.</p>
<p>Our standard pricing is a per-click fee for each claimed discount plus a $10/month platform fee. Right now, though, we're looking for pilot partners, and we'll waive all fees permanently for up to 5 businesses in the area.</p>
<p>If you'd be open to offering a discount and joining as a pilot partner, I'd love to connect.</p>
<p>Best,<br/>Ryan</p>`;

  const applyTemplate = (type: "custom" | "apartment" | "business") => {
    setContactType(type);
    if (type === "apartment") {
      setSubject(APARTMENT_SUBJECT);
      if (editorRef.current) editorRef.current.innerHTML = APARTMENT_BODY;
    } else if (type === "business") {
      setSubject(BUSINESS_SUBJECT);
      if (editorRef.current) editorRef.current.innerHTML = BUSINESS_BODY;
    } else {
      setSubject("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  };

  const fetchEmails = useCallback(() => {
    fetch("/api/admin/emails")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((data) => {
        setSent(data.sent || []);
        setReceived(data.received || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  // Build threads grouped by email address
  const threads = useMemo(() => {
    const map = new Map<string, Thread>();

    for (const s of sent) {
      const key = s.toEmail.toLowerCase();
      if (!map.has(key)) {
        const name = [s.toFirstName, s.toLastName].filter(Boolean).join(" ");
        map.set(key, { email: key, name, messages: [], lastActivity: s.createdAt, hasUnread: false, unreadCount: 0 });
      }
      const t = map.get(key)!;
      if (!t.name) t.name = [s.toFirstName, s.toLastName].filter(Boolean).join(" ");
      t.messages.push({
        id: s.id,
        direction: "sent",
        subject: s.subject,
        bodyHtml: s.bodyHtml,
        bodyText: s.body,
        read: true,
        status: s.status,
        createdAt: s.createdAt,
      });
    }

    for (const r of received) {
      const key = r.fromEmail.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { email: key, name: r.fromName || "", messages: [], lastActivity: r.createdAt, hasUnread: false, unreadCount: 0 });
      }
      const t = map.get(key)!;
      if (!t.name && r.fromName) t.name = r.fromName;
      t.messages.push({
        id: r.id,
        direction: "received",
        subject: r.subject,
        bodyHtml: r.bodyHtml,
        bodyText: r.bodyText,
        read: r.read,
        createdAt: r.createdAt,
      });
      if (!r.read) {
        t.hasUnread = true;
        t.unreadCount++;
      }
    }

    // Sort messages within each thread chronologically
    for (const t of map.values()) {
      t.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      t.lastActivity = t.messages[t.messages.length - 1]?.createdAt || t.lastActivity;
    }

    // Sort threads by most recent activity
    return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [sent, received]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const openThread = openThreadEmail ? threads.find((t) => t.email === openThreadEmail) : null;

  const markRead = async (emailId: string) => {
    await fetch("/api/admin/emails/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailId }),
    });
    setReceived((prev) => prev.map((e) => e.id === emailId ? { ...e, read: true } : e));
  };

  const markThreadRead = (thread: Thread) => {
    for (const m of thread.messages) {
      if (m.direction === "received" && !m.read) {
        markRead(m.id);
      }
    }
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
          setContactType("custom");
          if (editorRef.current) editorRef.current.innerHTML = "";
          fetchEmails();
        }, 2000);
      }
    } catch {}
    setSending(false);
  };

  const handleDeleteThread = async (email: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Delete entire conversation?")) return;
    await fetch("/api/admin/emails/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadEmail: email }),
    });
    if (openThreadEmail === email) setOpenThreadEmail(null);
    fetchEmails();
  };

  const handleDeleteMessage = async (msg: ThreadMessage) => {
    if (!confirm("Delete this message?")) return;
    const payload = msg.direction === "sent" ? { sentId: msg.id } : { receivedId: msg.id };
    await fetch("/api/admin/emails/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchEmails();
  };

  const handleThreadReply = async () => {
    if (!openThread || !replyRef.current) return;
    const bodyHtml = replyRef.current.innerHTML || "";
    if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
    setReplySending(true);
    // Use the last subject from the thread
    const lastSubject = openThread.messages[openThread.messages.length - 1]?.subject || "Re:";
    const reSubject = lastSubject.startsWith("Re:") ? lastSubject : `Re: ${lastSubject}`;
    try {
      const r = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: openThread.email,
          toFirstName: openThread.name.split(" ")[0] || null,
          toLastName: openThread.name.split(" ").slice(1).join(" ") || null,
          subject: reSubject,
          bodyHtml,
        }),
      });
      if (r.ok) {
        replyRef.current.innerHTML = "";
        fetchEmails();
      }
    } catch {}
    setReplySending(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" />
      </div>
    );
  }

  // Thread detail view
  if (openThread) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Back + header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setOpenThreadEmail(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
              {openThread.name || openThread.email}
            </h1>
            {openThread.name && (
              <p className="text-[13px] text-text-tertiary">{openThread.email}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[12px] text-text-tertiary">
              {openThread.messages.length} message{openThread.messages.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => handleDeleteThread(openThread.email)}
              title="Delete thread"
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {openThread.messages.map((m) => (
            <div
              key={m.id}
              className={`group/msg rounded-2xl border p-5 backdrop-blur-sm ${
                m.direction === "sent"
                  ? "border-coral/15 bg-coral/5 ml-8"
                  : "border-glass-border bg-white/70 mr-8"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    m.direction === "sent"
                      ? "bg-coral/15 text-coral"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {m.direction === "sent" ? "You" : openThread.name || openThread.email}
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {m.direction === "sent" && m.status === "failed" && (
                    <span className="text-[11px] font-medium text-red-500">Failed</span>
                  )}
                  <button
                    onClick={() => handleDeleteMessage(m)}
                    title="Delete message"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary/50 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover/msg:opacity-100"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
              {m.subject && (
                <p className="mb-1.5 text-[12px] font-semibold text-text-secondary">{m.subject}</p>
              )}
              {m.bodyHtml ? (
                <div className="text-[13px] text-text-primary leading-relaxed [&_a]:text-coral [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: m.bodyHtml }} />
              ) : (
                <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{m.bodyText}</p>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-4 backdrop-blur-sm">
          <div
            ref={replyRef}
            contentEditable
            className="min-h-[80px] w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral [&_a]:text-coral [&_a]:underline"
            data-placeholder={`Reply to ${openThread.name || openThread.email}...`}
            style={{ whiteSpace: "pre-wrap" }}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => { document.execCommand("bold"); replyRef.current?.focus(); }} title="Bold" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 2.5h4a2.5 2.5 0 010 5H3.5V2.5zM3.5 7.5h5a2.5 2.5 0 010 5H3.5V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => { document.execCommand("italic"); replyRef.current?.focus(); }} title="Italic" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 12.5h3M5.5 1.5h3M8.5 1.5l-3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => { const url = prompt("Link URL:"); if (url) { document.execCommand("createLink", false, url); replyRef.current?.focus(); } }} title="Insert link" className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 8l2-2m-2.5-1.5L7 3a2.828 2.828 0 014 4l-1.5 1.5m-4 0L4 10a2.828 2.828 0 01-4-4l1.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <button
              disabled={replySending}
              onClick={handleThreadReply}
              className="rounded-lg bg-coral px-5 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
              {replySending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inbox view — thread list
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Emails</h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            ryan@blockandmortar.co
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
                {totalUnread}
              </span>
            )}
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
              onClick={() => { setComposing(false); setToEmail(""); setToFirstName(""); setToLastName(""); setSubject(""); setContactType("custom"); if (editorRef.current) editorRef.current.innerHTML = ""; }}
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
              <div>
                <label className="block text-[12px] font-medium text-text-tertiary mb-1">Template</label>
                <div className="flex gap-2">
                  {(["apartment", "business", "custom"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => applyTemplate(type)}
                      className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${
                        contactType === type
                          ? "bg-coral text-white shadow-sm shadow-coral/20"
                          : "bg-white/80 border border-glass-border text-text-secondary hover:bg-white hover:text-text-primary"
                      }`}
                    >
                      {type === "apartment" ? "Apartment" : type === "business" ? "Business" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

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

      {/* Thread list */}
      <div className="mt-6 space-y-2">
        {threads.length === 0 && !composing && (
          <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <p className="text-[15px] text-text-tertiary">No conversations yet.</p>
            <button
              onClick={() => setComposing(true)}
              className="mt-3 text-[13px] font-medium text-coral hover:text-peach transition-colors"
            >
              Send your first email
            </button>
          </div>
        )}

        {threads.map((t) => {
          const lastMsg = t.messages[t.messages.length - 1];
          const lastPreview = lastMsg.bodyText?.slice(0, 80) || lastMsg.bodyHtml?.replace(/<[^>]*>/g, "").slice(0, 80) || "";
          const lastDirection = lastMsg.direction;

          return (
            <button
              key={t.email}
              onClick={() => { setOpenThreadEmail(t.email); markThreadRead(t); }}
              className={`group/thread flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left backdrop-blur-sm transition-all hover:shadow-sm ${
                t.hasUnread ? "border-coral/20 bg-white/80" : "border-glass-border bg-white/70"
              }`}
            >
              {/* Avatar */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                t.hasUnread ? "bg-coral/15 text-coral" : "bg-surface text-text-tertiary"
              }`}>
                {(t.name || t.email).charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-[14px] ${t.hasUnread ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>
                    {t.name || t.email}
                  </p>
                  {t.unreadCount > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                      {t.unreadCount}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-text-tertiary">
                    {new Date(t.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-text-tertiary">
                  {t.name ? t.email : ""}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-text-secondary">
                  <span className="text-text-tertiary">{lastDirection === "sent" ? "You: " : ""}</span>
                  {lastPreview}
                  {lastPreview.length >= 80 ? "..." : ""}
                </p>
              </div>

              {/* Message count + delete */}
              <span className="shrink-0 text-[11px] text-text-tertiary">
                {t.messages.length}
              </span>
              <button
                onClick={(e) => handleDeleteThread(t.email, e)}
                title="Delete thread"
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover/thread:opacity-100"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-tertiary">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
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

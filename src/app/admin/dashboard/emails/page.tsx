"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────

interface Contact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  company: string | null;
  type: string;
  lastContactedAt: string | null;
  contactList: { name: string } | null;
}

interface ContactList {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

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

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  bodyHtml: string;
  createdAt: string;
}

// ─── Templates ───────────────────────────────────────────────

const APARTMENT_BODY = `<p>Hi {{first_name}},</p>
<p>We're building a website widget, similar to the "Chat with us" or "Schedule a tour" tools on your site, that lets local restaurants and businesses offer discounts to prospective renters while they browse your apartment page.</p>
<p>Most rewards programs start after move-in. We want to reach renters earlier and encourage them to explore the neighborhood while they're still deciding where to live.</p>
<p>Businesses pay us per click, and we share 25% of that revenue with you for clicks that come from your website. There's no cost to you.</p>
<p>If you have 15 minutes in the next few weeks, I'd love to tell you more.</p>
<p>Best,<br/>Ryan</p>`;

const BUSINESS_BODY = `<p>Hi {{first_name}},</p>
<p>We're building a widget for local apartment websites that offers prospective renters a discount for visiting nearby businesses while they search for a place to live.</p>
<p>Renters browsing online often have no reason to visit the neighborhood. We want to give them one: a chance to experience a local spot like yours and, ideally, become a regular once they move in.</p>
<p>Most rewards programs target residents who have already moved in. We're focused on people who are still looking and open to exploring the area.</p>
<p>Our standard pricing is a per-click fee for each claimed discount plus a $25/month platform fee. Right now, though, we're looking for pilot partners, and we'll waive all fees permanently for up to 5 businesses in the area.</p>
<p>If you'd be open to offering a discount and joining as a pilot partner, I'd love to connect.</p>
<p>Best,<br/>Ryan</p>`;

function getSubject(firstName: string) {
  return firstName ? `Quick question, ${firstName}` : "Quick question,";
}

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Main Page ───────────────────────────────────────────────

export default function AdminEmailsPage() {
  const [tab, setTab] = useState<"contacts" | "inbox" | "templates">("contacts");

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "business" | "apartment">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showUploadTypePicker, setShowUploadTypePicker] = useState(false);
  const uploadTypeRef = useRef<"business" | "apartment">("business");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplType, setTplType] = useState<"business" | "apartment">("business");
  const [tplSubject, setTplSubject] = useState("");
  const tplEditorRef = useRef<HTMLDivElement>(null);
  const [tplSaving, setTplSaving] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Compose (from contacts) state
  const [composingFor, setComposingFor] = useState<Contact | null>(null);
  const [bulkContacts, setBulkContacts] = useState<Contact[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkReviewing, setBulkReviewing] = useState(true);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);
  const [composeTemplate, setComposeTemplate] = useState<"business" | "apartment">("business");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templatePicked, setTemplatePicked] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeSent, setComposeSent] = useState(false);
  const composeEditorRef = useRef<HTMLDivElement>(null);

  // Inbox state
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [received, setReceived] = useState<ReceivedEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [openThreadEmail, setOpenThreadEmail] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);
  const replyRef = useRef<HTMLDivElement>(null);

  // Global compose (new email)
  const [composing, setComposing] = useState(false);
  const [toEmail, setToEmail] = useState("");
  const [toFirstName, setToFirstName] = useState("");
  const [toLastName, setToLastName] = useState("");
  const [subject, setSubject] = useState("");
  const [contactType, setContactType] = useState<"custom" | "apartment" | "business">("custom");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load contacts
  const fetchContacts = useCallback(() => {
    fetch("/api/admin/contacts")
      .then((r) => r.json())
      .then((d) => { setContacts(d.contacts || []); setLists(d.lists || []); })
      .catch(() => {})
      .finally(() => setContactsLoading(false));
  }, []);

  // Load templates
  const fetchTemplates = useCallback(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Load inbox
  const fetchEmails = useCallback(() => {
    fetch("/api/admin/emails")
      .then((r) => {
        if (!r.ok) { window.location.href = "/admin/login"; throw new Error(); }
        return r.json();
      })
      .then((d) => { setSent(d.sent || []); setReceived(d.received || []); })
      .catch(() => {})
      .finally(() => setInboxLoading(false));
  }, []);

  useEffect(() => { fetchContacts(); fetchEmails(); fetchTemplates(); }, [fetchContacts, fetchEmails, fetchTemplates]);

  // Live-update subject as first name is typed
  useEffect(() => {
    if (contactType !== "custom" && subject.startsWith("Quick question")) {
      setSubject(toFirstName ? `Quick question, ${toFirstName}` : "Quick question,");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toFirstName]);

  const applyBodyForContact = (bodyHtml: string, firstName: string | null) =>
    bodyHtml.replace(/\{\{first_name\}\}/gi, firstName || "");

  // Open contact compose modal — skip picker if only one template matches
  const openComposeFor = (contact: Contact) => {
    setComposingFor(contact);
    setComposeSent(false);
    setSelectedTemplateId(null);
    setComposeSubject(getSubject(contact.firstName || ""));
    const matching = templates.filter((t) => t.type === contact.type);
    if (matching.length === 1) {
      const tpl = matching[0];
      setComposeTemplate(contact.type as "business" | "apartment");
      setSelectedTemplateId(tpl.id);
      setComposeSubject(applyBodyForContact(tpl.subject, contact.firstName));
      setTemplatePicked(true);
      setTimeout(() => {
        if (composeEditorRef.current) {
          composeEditorRef.current.innerHTML = applyBodyForContact(tpl.bodyHtml, contact.firstName);
        }
      }, 30);
    } else {
      setTemplatePicked(false);
    }
  };

  const pickTemplate = (tpl: EmailTemplate) => {
    setComposeTemplate(tpl.type as "business" | "apartment");
    setSelectedTemplateId(tpl.id);
    setComposeSubject(applyBodyForContact(tpl.subject, composingFor?.firstName ?? null));
    setTemplatePicked(true);
    setTimeout(() => {
      if (composeEditorRef.current) {
        composeEditorRef.current.innerHTML = applyBodyForContact(tpl.bodyHtml, composingFor?.firstName ?? null);
      }
    }, 30);
  };

  const openBulkCompose = () => {
    const contacts = filteredContacts.filter((c) => selectedIds.has(c.id));
    setBulkContacts(contacts);
    setComposeSent(false);
    setBulkReviewing(true);
    setBulkProgress(null);
    setSelectedTemplateId(null);
    // Pick dominant type
    const types = contacts.map((c) => c.type);
    const type = types.every((t) => t === "apartment") ? "apartment" : "business";
    const preview = contacts[0];
    setComposeSubject(getSubject(preview?.firstName || ""));
    const matching = templates.filter((t) => t.type === type);
    if (matching.length === 1) {
      const tpl = matching[0];
      setComposeTemplate(type as "business" | "apartment");
      setSelectedTemplateId(tpl.id);
      setComposeSubject(applyBodyForContact(tpl.subject, preview?.firstName ?? null));
      setTemplatePicked(true);
      setTimeout(() => {
        if (composeEditorRef.current)
          composeEditorRef.current.innerHTML = applyBodyForContact(tpl.bodyHtml, preview?.firstName ?? null);
      }, 30);
    } else {
      setComposeTemplate(type as "business" | "apartment");
      setTemplatePicked(false);
    }
  };

  const handleContactSend = async () => {
    if (!composingFor || !composeEditorRef.current) return;
    const bodyHtml = composeEditorRef.current.innerHTML;
    if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
    setComposeSending(true);
    try {
      const r = await fetch("/api/admin/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: composingFor.email,
          toFirstName: composingFor.firstName || "",
          toLastName: composingFor.lastName || "",
          subject: composeSubject,
          bodyHtml,
        }),
      });
      if (r.ok) {
        setComposeSent(true);
        setContacts((prev) =>
          prev.map((c) => c.id === composingFor.id ? { ...c, lastContactedAt: new Date().toISOString() } : c)
        );
        setTimeout(() => { setComposingFor(null); setComposeSent(false); }, 1500);
      }
    } catch {}
    setComposeSending(false);
  };

  const handleBulkSend = async () => {
    if (!composeEditorRef.current || bulkContacts.length === 0) return;
    // The editor has the TEMPLATE body (with {{first_name}} already swapped for the preview contact).
    // We need the raw template body to re-merge for each recipient.
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    const rawBody = tpl?.bodyHtml ?? composeEditorRef.current.innerHTML;
    const rawSubject = tpl?.subject ?? composeSubject;
    setBulkSending(true);
    setBulkProgress({ sent: 0, total: bulkContacts.length });
    let sent = 0;
    for (const contact of bulkContacts) {
      try {
        await fetch("/api/admin/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: contact.email,
            toFirstName: contact.firstName || "",
            toLastName: contact.lastName || "",
            subject: rawSubject,
            bodyHtml: rawBody,
          }),
        });
      } catch {}
      sent++;
      setBulkProgress({ sent, total: bulkContacts.length });
    }
    setContacts((prev) =>
      prev.map((c) => bulkContacts.find((b) => b.id === c.id) ? { ...c, lastContactedAt: new Date().toISOString() } : c)
    );
    setBulkSending(false);
    setComposeSent(true);
    setTimeout(() => { setBulkContacts([]); setComposeSent(false); setSelectedIds(new Set()); setBulkProgress(null); }, 2500);
  };

  // File upload
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    form.append("type", uploadTypeRef.current);
    try {
      const r = await fetch("/api/admin/contacts/upload", { method: "POST", body: form });
      const d = await r.json();
      if (d.success) {
        setUploadMsg(`Imported ${d.imported} contacts${d.skipped ? ` (${d.skipped} skipped)` : ""}`);
        fetchContacts();
        setTimeout(() => setUploadMsg(""), 5000);
      } else {
        setUploadMsg(d.error || "Upload failed");
      }
    } catch { setUploadMsg("Upload failed"); }
    setUploading(false);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    await fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: id }),
    });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Inbox helpers
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
      t.messages.push({ id: s.id, direction: "sent", subject: s.subject, bodyHtml: s.bodyHtml, bodyText: s.body, read: true, status: s.status, createdAt: s.createdAt });
    }
    for (const r of received) {
      const key = r.fromEmail.toLowerCase();
      if (!map.has(key)) map.set(key, { email: key, name: r.fromName || "", messages: [], lastActivity: r.createdAt, hasUnread: false, unreadCount: 0 });
      const t = map.get(key)!;
      if (!t.name && r.fromName) t.name = r.fromName;
      t.messages.push({ id: r.id, direction: "received", subject: r.subject, bodyHtml: r.bodyHtml, bodyText: r.bodyText, read: r.read, createdAt: r.createdAt });
      if (!r.read) { t.hasUnread = true; t.unreadCount++; }
    }
    for (const t of map.values()) {
      t.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      t.lastActivity = t.messages[t.messages.length - 1]?.createdAt || t.lastActivity;
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [sent, received]);

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const openThread = openThreadEmail ? threads.find((t) => t.email === openThreadEmail) : null;

  const markRead = async (emailId: string) => {
    await fetch("/api/admin/emails/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailId }) });
    setReceived((prev) => prev.map((e) => e.id === emailId ? { ...e, read: true } : e));
  };
  const markThreadRead = (thread: Thread) => { for (const m of thread.messages) { if (m.direction === "received" && !m.read) markRead(m.id); } };

  const handleDeleteThread = async (email: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Delete entire conversation?")) return;
    await fetch("/api/admin/emails/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadEmail: email }) });
    if (openThreadEmail === email) setOpenThreadEmail(null);
    fetchEmails();
  };

  const handleDeleteMessage = async (msg: ThreadMessage) => {
    if (!confirm("Delete this message?")) return;
    const payload = msg.direction === "sent" ? { sentId: msg.id } : { receivedId: msg.id };
    await fetch("/api/admin/emails/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    fetchEmails();
  };

  const handleThreadReply = async () => {
    if (!openThread || !replyRef.current) return;
    const bodyHtml = replyRef.current.innerHTML || "";
    if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
    setReplySending(true);
    const lastSubject = openThread.messages[openThread.messages.length - 1]?.subject || "Re:";
    const reSubject = lastSubject.startsWith("Re:") ? lastSubject : `Re: ${lastSubject}`;
    try {
      const r = await fetch("/api/admin/emails/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: openThread.email, toFirstName: openThread.name.split(" ")[0] || null, toLastName: openThread.name.split(" ").slice(1).join(" ") || null, subject: reSubject, bodyHtml }),
      });
      if (r.ok) { replyRef.current.innerHTML = ""; fetchEmails(); }
    } catch {}
    setReplySending(false);
  };

  // Global compose helpers
  const GLOBAL_APARTMENT_SUBJECT = "Quick question, {{first_name}}";
  const GLOBAL_BUSINESS_SUBJECT = "Quick question, {{first_name}}";
  const applyTemplate = (type: "custom" | "apartment" | "business") => {
    setContactType(type);
    if (type === "apartment") { setSubject(GLOBAL_APARTMENT_SUBJECT); if (editorRef.current) editorRef.current.innerHTML = APARTMENT_BODY; }
    else if (type === "business") { setSubject(GLOBAL_BUSINESS_SUBJECT); if (editorRef.current) editorRef.current.innerHTML = BUSINESS_BODY; }
    else { setSubject(""); if (editorRef.current) editorRef.current.innerHTML = ""; }
  };

  const handleSend = async () => {
    const bodyHtml = editorRef.current?.innerHTML || "";
    if (!toEmail || !subject || !bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
    setSending(true);
    try {
      const r = await fetch("/api/admin/emails/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toEmail, toFirstName, toLastName, subject, bodyHtml }) });
      if (r.ok) {
        setSentSuccess(true);
        setTimeout(() => { setSentSuccess(false); setComposing(false); setToEmail(""); setToFirstName(""); setToLastName(""); setSubject(""); setContactType("custom"); if (editorRef.current) editorRef.current.innerHTML = ""; fetchEmails(); fetchContacts(); }, 2000);
      }
    } catch {}
    setSending(false);
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (c.company || "").toLowerCase().includes(q) ||
        (c.firstName || "").toLowerCase().includes(q) ||
        (c.lastName || "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, typeFilter]);

  // ─── Thread detail view ──────────────────────────────────────
  if (tab === "inbox" && openThread) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => setOpenThreadEmail(null)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/60 text-text-tertiary transition-all hover:bg-white hover:text-text-primary hover:shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">{openThread.name || openThread.email}</h1>
            {openThread.name && <p className="text-[13px] text-text-tertiary">{openThread.email}</p>}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[12px] text-text-tertiary">{openThread.messages.length} message{openThread.messages.length !== 1 ? "s" : ""}</span>
            <button onClick={() => handleDeleteThread(openThread.email)} title="Delete thread" className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-red-50 hover:text-red-500 transition-colors">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {openThread.messages.map((m) => (
            <div key={m.id} className={`group/msg rounded-2xl border p-5 backdrop-blur-sm ${m.direction === "sent" ? "border-coral/15 bg-coral/5 ml-8" : "border-glass-border bg-white/70 mr-8"}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.direction === "sent" ? "bg-coral/15 text-coral" : "bg-blue-50 text-blue-600"}`}>{m.direction === "sent" ? "You" : openThread.name || openThread.email}</span>
                  <span className="text-[11px] text-text-tertiary">{new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  {m.direction === "sent" && m.status === "failed" && <span className="text-[11px] font-medium text-red-500">Failed</span>}
                  <button onClick={() => handleDeleteMessage(m)} title="Delete" className="flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary/50 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover/msg:opacity-100">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
              {m.subject && <p className="mb-1.5 text-[12px] font-semibold text-text-secondary">{m.subject}</p>}
              {m.bodyHtml ? <div className="text-[13px] text-text-primary leading-relaxed [&_a]:text-coral [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: m.bodyHtml }} /> : <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap">{m.bodyText}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-glass-border bg-white/70 p-4 backdrop-blur-sm">
          <div ref={replyRef} contentEditable className="min-h-[80px] w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral" data-placeholder={`Reply to ${openThread.name || openThread.email}...`} style={{ whiteSpace: "pre-wrap" }} />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button onClick={() => { document.execCommand("bold"); replyRef.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 2.5h4a2.5 2.5 0 010 5H3.5V2.5zM3.5 7.5h5a2.5 2.5 0 010 5H3.5V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <button onClick={() => { document.execCommand("italic"); replyRef.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 12.5h3M5.5 1.5h3M8.5 1.5l-3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            </div>
            <button disabled={replySending} onClick={handleThreadReply} className="rounded-lg bg-coral px-5 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50">{replySending ? "Sending..." : "Send"}</button>
          </div>
        </div>
        <style jsx global>{`[contenteditable][data-placeholder]:empty::before { content: attr(data-placeholder); color: #a8a29e; pointer-events: none; }`}</style>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary">Outreach</h1>
          <p className="mt-1 text-[15px] text-text-secondary">ryan@blockandmortar.co</p>
        </div>
        <button onClick={() => { setComposing(true); setTab("inbox"); }} className="rounded-xl bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-coral/25 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98]">
          Compose
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border border-glass-border bg-white/60 p-1 w-fit">
        {(["contacts", "inbox", "templates"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-5 py-2 text-[13px] font-medium transition-all capitalize ${tab === t ? "bg-coral text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            {t === "inbox" ? (
              <span className="flex items-center gap-2">
                Responses
                {totalUnread > 0 && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/30 px-1 text-[10px] font-bold">{totalUnread}</span>}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Contacts
                <span className="text-[10px] opacity-60">{contacts.length}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTACTS TAB ─────────────────────────────────────────── */}
      {tab === "contacts" && (
        <div className="mt-6">
          {/* Upload + search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." className="w-full rounded-xl border border-glass-border bg-white/70 py-2.5 pl-9 pr-4 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" />
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = ""; }} />
            <div className="relative">
              <button onClick={() => setShowUploadTypePicker((v) => !v)} disabled={uploading} className="flex items-center gap-2 rounded-xl border border-glass-border bg-white/70 px-4 py-2.5 text-[13px] font-medium text-text-secondary hover:bg-white hover:text-text-primary transition-all disabled:opacity-50">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 7l4-5 4 5M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {uploading ? "Uploading..." : "Upload list"}
              </button>
              {showUploadTypePicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUploadTypePicker(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-glass-border bg-white shadow-lg shadow-black/5 overflow-hidden">
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wide">Contact type</p>
                  {(["business", "apartment"] as const).map((t) => (
                    <button key={t} onClick={() => { uploadTypeRef.current = t; setShowUploadTypePicker(false); fileInputRef.current?.click(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-text-secondary hover:bg-surface/60 hover:text-text-primary transition-colors">
                      <span className={`h-2 w-2 rounded-full ${t === "business" ? "bg-blue-400" : "bg-green-400"}`} />
                      {t === "business" ? "Business" : "Apartment"}
                    </button>
                  ))}
                  <div className="pb-1.5" />
                </div>
                </>
              )}
            </div>
          </div>

          {uploadMsg && (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-[13px] text-green-700">{uploadMsg}</div>
          )}

          {/* Type filter toggle */}
          <div className="mt-3 flex gap-1 rounded-xl border border-glass-border bg-white/60 p-1 w-fit">
            {(["all", "business", "apartment"] as const).map((t) => {
              const count = t === "all" ? contacts.length : contacts.filter((c) => c.type === t).length;
              return (
                <button key={t} onClick={() => setTypeFilter(t)} className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all capitalize ${typeFilter === t ? "bg-coral text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
                  {t === "all" ? "All" : t === "business" ? "Businesses" : "Apartments"}
                  <span className={`ml-1.5 text-[10px] ${typeFilter === t ? "opacity-70" : "text-text-tertiary"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Lists summary */}
          {lists.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {lists.map((l) => (
                <span key={l.id} className="rounded-full border border-glass-border bg-white/70 px-3 py-1 text-[11px] text-text-tertiary">
                  {l.name} · {l.count} contacts
                </span>
              ))}
            </div>
          )}

          {/* Contact list */}
          <div className="mt-4">
            {contactsLoading ? (
              <div className="flex h-40 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" /></div>
            ) : filteredContacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-glass-border bg-white/50 py-16 text-center">
                <p className="text-[15px] text-text-tertiary">{search ? "No contacts match your search." : "No contacts yet."}</p>
                {!search && <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-[13px] font-medium text-coral">Upload a contact list</button>}
              </div>
            ) : (
              <>
              <div className="overflow-hidden rounded-2xl border border-glass-border bg-white/70 backdrop-blur-sm">
                {/* Table header */}
                <div className="grid grid-cols-[auto_2fr_1.5fr_2fr_1fr_auto] gap-4 border-b border-glass-border bg-surface/40 px-5 py-2.5 items-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded accent-coral cursor-pointer"
                    checked={filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.has(c.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredContacts.map((c) => c.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
                  {["Company", "Name", "Email", "Last touched", ""].map((h) => (
                    <span key={h} className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">{h}</span>
                  ))}
                </div>

                {filteredContacts.map((c, i) => (
                  <div key={c.id} className={`group grid grid-cols-[auto_2fr_1.5fr_2fr_1fr_auto] items-center gap-4 px-5 py-3.5 ${i !== filteredContacts.length - 1 ? "border-b border-glass-border" : ""} ${selectedIds.has(c.id) ? "bg-coral/5" : "hover:bg-white/60"} transition-colors`}>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded accent-coral cursor-pointer"
                      checked={selectedIds.has(c.id)}
                      onChange={(e) => {
                        const next = new Set(selectedIds);
                        if (e.target.checked) next.add(c.id); else next.delete(c.id);
                        setSelectedIds(next);
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-text-primary">{c.company || "—"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${c.type === "apartment" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                          {c.type === "apartment" ? "Apartment" : "Business"}
                        </span>
                        {c.contactList && <p className="text-[11px] text-text-tertiary truncate">{c.contactList.name}</p>}
                      </div>
                    </div>
                    <p className="truncate text-[13px] text-text-secondary">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</p>
                    <p className="truncate text-[12px] text-text-tertiary">{c.email}</p>
                    <div>
                      {c.lastContactedAt ? (
                        <span className={`text-[12px] font-medium ${Date.now() - new Date(c.lastContactedAt).getTime() < 7 * 86400000 ? "text-green-600" : "text-text-tertiary"}`}>
                          {timeAgo(c.lastContactedAt)}
                        </span>
                      ) : (
                        <span className="text-[12px] text-text-tertiary italic">Never</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openComposeFor(c)} className="rounded-lg bg-coral px-3 py-1.5 text-[12px] font-medium text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-[1.02] shadow-sm shadow-coral/20">
                        View
                      </button>
                      <button onClick={() => handleDeleteContact(c.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk action bar */}
              {selectedIds.size > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-coral/20 bg-coral/5 px-5 py-3">
                  <p className="text-[13px] font-medium text-text-secondary">
                    <span className="font-semibold text-coral">{selectedIds.size}</span> contact{selectedIds.size !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedIds(new Set())} className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors">Clear</button>
                    <button onClick={openBulkCompose} className="rounded-lg bg-coral px-4 py-1.5 text-[12px] font-medium text-white shadow-sm shadow-coral/20 hover:scale-[1.01] transition-all">
                      View & Send →
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── INBOX TAB ────────────────────────────────────────────── */}
      {tab === "inbox" && (
        <div className="mt-6">
          {/* Global compose panel */}
          {composing && (
            <div className="mb-6 rounded-2xl border border-glass-border bg-white/70 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-semibold text-text-primary">New Email</h2>
                <button onClick={() => { setComposing(false); setToEmail(""); setToFirstName(""); setToLastName(""); setSubject(""); setContactType("custom"); if (editorRef.current) editorRef.current.innerHTML = ""; }} className="text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors">Cancel</button>
              </div>
              {sentSuccess ? (
                <div className="rounded-xl bg-green-50 px-4 py-8 text-center"><p className="text-[15px] font-medium text-green-700">Email sent!</p></div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-text-tertiary mb-1">Template</label>
                    <div className="flex gap-2">
                      {(["apartment", "business", "custom"] as const).map((type) => (
                        <button key={type} onClick={() => applyTemplate(type)} className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${contactType === type ? "bg-coral text-white shadow-sm shadow-coral/20" : "bg-white/80 border border-glass-border text-text-secondary hover:bg-white hover:text-text-primary"}`}>
                          {type === "apartment" ? "Apartment" : type === "business" ? "Business" : "Custom"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1"><label className="block text-[12px] font-medium text-text-tertiary mb-1">Email</label><input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="prospect@example.com" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" /></div>
                    <div className="w-32"><label className="block text-[12px] font-medium text-text-tertiary mb-1">First name</label><input value={toFirstName} onChange={(e) => setToFirstName(e.target.value)} placeholder="Jane" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" /></div>
                    <div className="w-32"><label className="block text-[12px] font-medium text-text-tertiary mb-1">Last name</label><input value={toLastName} onChange={(e) => setToLastName(e.target.value)} placeholder="Smith" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" /></div>
                  </div>
                  <div><label className="block text-[12px] font-medium text-text-tertiary mb-1">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-tertiary focus:ring-2 focus:ring-coral/20 focus:border-coral" /></div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12px] font-medium text-text-tertiary">Message</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { document.execCommand("insertText", false, "{{first_name}}"); editorRef.current?.focus(); }} className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-coral bg-coral/10 hover:bg-coral/20 transition-colors">{"{{first_name}}"}</button>
                        <button onClick={() => { document.execCommand("insertText", false, "{{last_name}}"); editorRef.current?.focus(); }} className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-coral bg-coral/10 hover:bg-coral/20 transition-colors">{"{{last_name}}"}</button>
                        <div className="mx-1 h-4 w-px bg-glass-border" />
                        <button onClick={() => { document.execCommand("bold"); editorRef.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 2.5h4a2.5 2.5 0 010 5H3.5V2.5zM3.5 7.5h5a2.5 2.5 0 010 5H3.5V7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                        <button onClick={() => { document.execCommand("italic"); editorRef.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded text-text-tertiary hover:bg-white/80 hover:text-text-primary transition-colors"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 12.5h3M5.5 1.5h3M8.5 1.5l-3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      </div>
                    </div>
                    <div ref={editorRef} contentEditable className="min-h-[180px] w-full rounded-lg border border-glass-border bg-white/80 px-3 py-2.5 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral [&_a]:text-coral [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-6 [&_p:last-child]:mb-0" data-placeholder="Write your message..." style={{ whiteSpace: "pre-wrap" }} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-text-tertiary">Sending as <span className="font-medium text-text-secondary">ryan@blockandmortar.co</span></p>
                    <button disabled={sending || !toEmail || !subject} onClick={handleSend} className="rounded-lg bg-coral px-5 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50">{sending ? "Sending..." : "Send Email"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thread list */}
          {inboxLoading ? (
            <div className="flex h-40 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" /></div>
          ) : threads.length === 0 ? (
            <div className="rounded-2xl border border-glass-border bg-white/70 p-12 text-center backdrop-blur-sm">
              <p className="text-[15px] text-text-tertiary">No responses yet. Start by sending from the Contacts tab.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((t) => {
                const lastMsg = t.messages[t.messages.length - 1];
                const lastPreview = lastMsg.bodyText?.slice(0, 80) || lastMsg.bodyHtml?.replace(/<[^>]*>/g, "").slice(0, 80) || "";
                return (
                  <button key={t.email} onClick={() => { setOpenThreadEmail(t.email); markThreadRead(t); }} className={`group/thread flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left backdrop-blur-sm transition-all hover:shadow-sm ${t.hasUnread ? "border-coral/20 bg-white/80" : "border-glass-border bg-white/70"}`}>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${t.hasUnread ? "bg-coral/15 text-coral" : "bg-surface text-text-tertiary"}`}>{(t.name || t.email).charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-[14px] ${t.hasUnread ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>{t.name || t.email}</p>
                        {t.unreadCount > 0 && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{t.unreadCount}</span>}
                        <span className="ml-auto shrink-0 text-[11px] text-text-tertiary">{new Date(t.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-text-tertiary">{t.name ? t.email : ""}</p>
                      <p className="mt-0.5 truncate text-[12px] text-text-secondary"><span className="text-text-tertiary">{lastMsg.direction === "sent" ? "You: " : ""}</span>{lastPreview}{lastPreview.length >= 80 ? "..." : ""}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-text-tertiary">{t.messages.length}</span>
                    <button onClick={(e) => handleDeleteThread(t.email, e)} title="Delete thread" className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover/thread:opacity-100">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-text-tertiary"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bulk compose modal */}
      {bulkContacts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget && !bulkSending) setBulkContacts([]); }}>
          <div className="w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[16px] font-semibold text-text-primary">
                  {bulkReviewing ? "Review recipients" : `Send to ${bulkContacts.length} contacts`}
                </p>
                <p className="text-[12px] text-text-tertiary mt-0.5">
                  {bulkReviewing ? `${bulkContacts.length} selected` : `${bulkContacts.length} contacts · ${templates.find((t) => t.id === selectedTemplateId)?.name ?? ""}`}
                </p>
              </div>
              {!bulkSending && (
                <button onClick={() => setBulkContacts([])} className="text-text-tertiary hover:text-text-primary transition-colors">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              )}
            </div>

            {composeSent ? (
              <div className="rounded-xl bg-green-50 px-4 py-10 text-center">
                <p className="text-[16px] font-semibold text-green-700">All sent!</p>
                <p className="mt-1 text-[13px] text-green-600">Sent {bulkContacts.length} emails successfully</p>
              </div>
            ) : bulkReviewing ? (
              /* ── Step 0: Review recipient list ── */
              <div>
                <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-glass-border divide-y divide-glass-border">
                  {bulkContacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-text-primary truncate">
                          {c.company || [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email}
                        </p>
                        <p className="text-[11px] text-text-tertiary truncate">{c.email}</p>
                      </div>
                      <button
                        onClick={() => setBulkContacts((prev) => prev.filter((x) => x.id !== c.id))}
                        className="ml-3 flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[12px] text-text-tertiary">{bulkContacts.length} recipient{bulkContacts.length !== 1 ? "s" : ""}</p>
                  <button
                    disabled={bulkContacts.length === 0}
                    onClick={() => setBulkReviewing(false)}
                    className="rounded-xl bg-coral px-6 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            ) : !templatePicked ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] text-text-secondary">Choose a template:</p>
                  <button onClick={() => setBulkReviewing(true)} className="text-[11px] text-text-tertiary hover:text-coral transition-colors underline underline-offset-2">← back to list</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.filter((t) => t.type === composeTemplate).map((tpl) => (
                    <button key={tpl.id} onClick={() => pickTemplate(tpl)} className="rounded-2xl border-2 border-glass-border bg-surface/40 p-4 text-left transition-all hover:border-coral/40 hover:bg-coral/5 hover:shadow-sm active:scale-[0.98]">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tpl.type === "business" ? "bg-coral/15 text-coral" : "bg-blue-50 text-blue-600"}`}>{tpl.name}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-text-secondary line-clamp-3">{tpl.bodyHtml.replace(/<[^>]*>/g, "").replace(/\{\{first_name\}\}/gi, bulkContacts[0]?.firstName || "there")}</p>
                      <p className="mt-3 text-[11px] font-semibold text-coral">View template →</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${composeTemplate === "business" ? "bg-coral/15 text-coral" : "bg-blue-50 text-blue-600"}`}>
                    {templates.find((t) => t.id === selectedTemplateId)?.name ?? composeTemplate}
                  </span>
                  {templates.filter((t) => t.type === composeTemplate).length > 1 && !bulkSending && (
                    <button onClick={() => setTemplatePicked(false)} className="text-[11px] text-text-tertiary hover:text-coral transition-colors underline underline-offset-2">change template</button>
                  )}
                  <span className="ml-auto text-[11px] text-text-tertiary">Preview: {bulkContacts[0]?.firstName || bulkContacts[0]?.email}</span>
                </div>

                <div className="mb-3">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">Subject</label>
                  <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} disabled={bulkSending} className="w-full rounded-lg border border-glass-border bg-surface/50 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral disabled:opacity-60" />
                </div>

                <div ref={composeEditorRef} contentEditable={!bulkSending} suppressContentEditableWarning className="min-h-[280px] w-full rounded-xl border border-glass-border bg-surface/40 px-4 py-3 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral [&_a]:text-coral [&_a]:underline [&_p]:mb-6 [&_p:last-child]:mb-0" style={{ whiteSpace: "pre-wrap" }} />

                <div className="mt-4 flex items-center justify-between">
                  {bulkSending && bulkProgress ? (
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <div className="flex-1 h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className="h-full rounded-full bg-coral transition-all duration-300" style={{ width: `${(bulkProgress.sent / bulkProgress.total) * 100}%` }} />
                      </div>
                      <span className="text-[12px] text-text-tertiary whitespace-nowrap">{bulkProgress.sent}/{bulkProgress.total}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-tertiary">{"{{first_name}}"} personalizes per recipient</p>
                  )}
                  <button onClick={handleBulkSend} disabled={bulkSending} className="rounded-xl bg-coral px-6 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap">
                    {bulkSending ? "Sending..." : `Send to ${bulkContacts.length}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contact quick-compose modal */}
      {composingFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center" onClick={(e) => { if (e.target === e.currentTarget) setComposingFor(null); }}>
          <div className="w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[16px] font-semibold text-text-primary">
                  {composingFor.company || [composingFor.firstName, composingFor.lastName].filter(Boolean).join(" ") || composingFor.email}
                </p>
                <p className="text-[12px] text-text-tertiary mt-0.5">{composingFor.email}</p>
              </div>
              <button onClick={() => setComposingFor(null)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {composeSent ? (
              <div className="rounded-xl bg-green-50 px-4 py-10 text-center">
                <p className="text-[16px] font-semibold text-green-700">Sent!</p>
                <p className="mt-1 text-[13px] text-green-600">Email delivered to {composingFor.email}</p>
              </div>
            ) : !templatePicked ? (
              /* ── Step 1: Template picker ── */
              <div>
                <p className="mb-4 text-[13px] text-text-secondary">Choose a template to preview:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.filter((t) => t.type === composingFor.type).map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => pickTemplate(tpl)}
                      className="rounded-2xl border-2 border-glass-border bg-surface/40 p-4 text-left transition-all hover:border-coral/40 hover:bg-coral/5 hover:shadow-sm active:scale-[0.98]"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tpl.type === "business" ? "bg-coral/15 text-coral" : "bg-blue-50 text-blue-600"}`}>{tpl.name}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-text-secondary line-clamp-3">{tpl.bodyHtml.replace(/<[^>]*>/g, "").replace(/\{\{first_name\}\}/gi, composingFor.firstName || "there")}</p>
                      <p className="mt-3 text-[11px] font-semibold text-coral">View template →</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Step 2: Edit & send ── */
              <>
                {/* Template switcher (back to picker) */}
                <div className="mb-4 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${composeTemplate === "business" ? "bg-coral/15 text-coral" : "bg-blue-50 text-blue-600"}`}>
                    {templates.find((t) => t.id === selectedTemplateId)?.name ?? composeTemplate}
                  </span>
                  {templates.filter((t) => t.type === composingFor.type).length > 1 && (
                    <button onClick={() => setTemplatePicked(false)} className="text-[11px] text-text-tertiary hover:text-coral transition-colors underline underline-offset-2">change template</button>
                  )}
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <label className="block text-[12px] font-medium text-text-tertiary mb-1">Subject</label>
                  <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} className="w-full rounded-lg border border-glass-border bg-surface/50 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
                </div>

                {/* Body */}
                <div ref={composeEditorRef} contentEditable className="min-h-[280px] w-full rounded-xl border border-glass-border bg-surface/40 px-4 py-3 text-[13px] text-text-primary outline-none leading-relaxed focus:ring-2 focus:ring-coral/20 focus:border-coral [&_a]:text-coral [&_a]:underline [&_p]:mb-6 [&_p:last-child]:mb-0" style={{ whiteSpace: "pre-wrap" }} />

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[11px] text-text-tertiary">
                    {composingFor.firstName ? (
                      <span>To <span className="font-medium text-text-secondary">{composingFor.firstName}</span> · <span className="font-medium text-text-secondary">{composeSubject}</span></span>
                    ) : composeSubject}
                  </p>
                  <button onClick={handleContactSend} disabled={composeSending} className="rounded-xl bg-coral px-6 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50">
                    {composeSending ? "Sending..." : "Send Email"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TEMPLATES TAB ──────────────────────────────────────── */}
      {tab === "templates" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] text-text-secondary">Reusable email templates for outreach.</p>
            <button onClick={() => { setNewTemplate(true); setEditingTemplate(null); setTplName(""); setTplType("business"); setTplSubject("Quick question, {{first_name}}"); setTimeout(() => { if (tplEditorRef.current) tplEditorRef.current.innerHTML = ""; }, 20); }} className="rounded-xl bg-coral px-4 py-2 text-[13px] font-medium text-white shadow-sm shadow-coral/20 hover:scale-[1.01] transition-all">
              + New template
            </button>
          </div>

          {/* Template editor (create or edit) */}
          {(newTemplate || editingTemplate) && (
            <div className="mb-6 rounded-2xl border border-glass-border bg-white/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-text-primary">{editingTemplate ? "Edit template" : "New template"}</h3>
                <button onClick={() => { setNewTemplate(false); setEditingTemplate(null); }} className="text-[12px] text-text-tertiary hover:text-text-primary">Cancel</button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-text-tertiary mb-1">Template name</label>
                    <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g. Pilot Partner Outreach" className="w-full rounded-lg border border-glass-border bg-surface/50 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-tertiary mb-1">Type</label>
                    <div className="flex gap-2">
                      {(["business", "apartment"] as const).map((t) => (
                        <button key={t} onClick={() => setTplType(t)} className={`flex-1 rounded-lg py-2 text-[12px] font-medium transition-all capitalize ${tplType === t ? "bg-coral text-white shadow-sm shadow-coral/20" : "border border-glass-border bg-white/80 text-text-secondary hover:bg-white"}`}>{t === "business" ? "Business" : "Apartment"}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-tertiary mb-1">Subject <span className="text-text-tertiary/60 font-normal">— use {"{{"} first_name {"}}"} for merge</span></label>
                  <input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} className="w-full rounded-lg border border-glass-border bg-surface/50 px-3 py-2 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-text-tertiary mb-1">Body <span className="text-text-tertiary/60 font-normal">— use {"{{"} first_name {"}}"} for merge</span></label>
                  <div
                    ref={tplEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Write your email body..."
                    className="min-h-[160px] w-full rounded-lg border border-glass-border bg-surface/50 px-3 py-2.5 text-[13px] text-text-primary outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={tplSaving}
                    onClick={async () => {
                      if (!tplName || !tplSubject || !tplEditorRef.current) return;
                      const bodyHtml = tplEditorRef.current.innerHTML;
                      if (!bodyHtml.replace(/<[^>]*>/g, "").trim()) return;
                      setTplSaving(true);
                      try {
                        const method = editingTemplate ? "PUT" : "POST";
                        const body = editingTemplate
                          ? { id: editingTemplate.id, name: tplName, type: tplType, subject: tplSubject, bodyHtml }
                          : { name: tplName, type: tplType, subject: tplSubject, bodyHtml };
                        const r = await fetch("/api/admin/email-templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                        if (r.ok) { fetchTemplates(); setNewTemplate(false); setEditingTemplate(null); }
                      } finally { setTplSaving(false); }
                    }}
                    className="rounded-xl bg-coral px-6 py-2.5 text-[13px] font-medium text-white shadow-sm shadow-coral/20 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {tplSaving ? "Saving..." : editingTemplate ? "Save changes" : "Create template"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template list */}
          {templatesLoading ? (
            <div className="flex h-40 items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-text-tertiary border-t-text-primary" /></div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-glass-border bg-white/50 py-16 text-center">
              <p className="text-[15px] text-text-tertiary">No templates yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="group rounded-2xl border border-glass-border bg-white/70 p-5 backdrop-blur-sm hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[14px] font-semibold text-text-primary">{tpl.name}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${tpl.type === "business" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                        {tpl.type === "business" ? "Business" : "Apartment"}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => {
                        setEditingTemplate(tpl); setNewTemplate(false);
                        setTplName(tpl.name); setTplType(tpl.type as "business" | "apartment"); setTplSubject(tpl.subject);
                        setTimeout(() => { if (tplEditorRef.current) tplEditorRef.current.innerHTML = tpl.bodyHtml; }, 20);
                      }} className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-text-tertiary border border-glass-border bg-white hover:text-text-primary transition-colors">Edit</button>
                      <button onClick={async () => {
                        if (!confirm("Delete this template?")) return;
                        await fetch("/api/admin/email-templates", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: tpl.id }) });
                        fetchTemplates();
                      }} className="flex h-7 w-7 items-center justify-center rounded-full text-text-tertiary/40 hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-tertiary mb-2">{tpl.subject}</p>
                  <p className="text-[12px] text-text-secondary line-clamp-2">{tpl.bodyHtml.replace(/<[^>]*>/g, "")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`[contenteditable][data-placeholder]:empty::before { content: attr(data-placeholder); color: #a8a29e; pointer-events: none; }`}</style>
    </div>
  );
}

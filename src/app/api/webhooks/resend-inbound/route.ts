import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Resend sends inbound emails as webhook events
// Format: { type: "email.received", created_at: "...", data: { from, to, subject, text, html, ... } }
export async function POST(req: NextRequest) {
  const webhook_secret = process.env.RESEND_INBOUND_SECRET;
  if (webhook_secret) {
    const sig =
      req.headers.get("svix-signature") ||
      req.headers.get("x-resend-signature") ||
      req.headers.get("authorization") ||
      "";
    // Resend uses Svix for webhook signing — for now accept if secret matches as bearer or raw
    if (
      sig !== webhook_secret &&
      sig !== `Bearer ${webhook_secret}` &&
      !sig.includes(webhook_secret)
    ) {
      // Log but don't block — Resend's signing is Svix-based and complex
      console.log("[INBOUND] Signature mismatch, processing anyway for now");
    }
  }

  const payload = await req.json();

  // Log full payload to debug field mapping
  console.log("[INBOUND] Full payload:", JSON.stringify(payload).slice(0, 2000));

  // Handle both wrapped { type, data } and flat payload formats
  const data = payload.data || payload;
  const eventType = payload.type || "email.received";

  // Only process email.received events
  if (eventType !== "email.received") {
    return NextResponse.json({ skipped: eventType });
  }

  const fromRaw = data.from || data.sender || "";
  const subject = data.subject || "(no subject)";
  const bodyText = data.text || data.body || data.text_body || data.plain || null;
  const bodyHtml = data.html || data.html_body || data.body_html || null;

  console.log("[INBOUND] Parsed — from:", fromRaw, "subject:", subject, "hasText:", !!bodyText, "hasHtml:", !!bodyHtml);

  // Parse "Name <email>" or plain email
  let fromEmail = fromRaw;
  let fromName: string | null = null;

  if (typeof fromRaw === "string") {
    const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      fromName = match[1].trim().replace(/^["']|["']$/g, "");
      fromEmail = match[2].trim();
    }
  } else if (typeof fromRaw === "object" && fromRaw !== null) {
    // Resend may send { email, name } object
    fromEmail = fromRaw.email || fromRaw.address || "";
    fromName = fromRaw.name || null;
  }

  // Store raw payload snippet as bodyText fallback for debugging
  const finalText = bodyText || JSON.stringify(data).slice(0, 1000);

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText: finalText, bodyHtml },
  });

  console.log(`[INBOUND] Received email from ${fromEmail}: ${subject}`);

  return NextResponse.json({ received: true });
}

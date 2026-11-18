import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Handle wrapped { type, data } or flat format
  const data = payload.data || payload;
  const eventType = payload.type || "email.received";

  if (eventType !== "email.received") {
    return NextResponse.json({ skipped: eventType });
  }

  const fromRaw = data.from || "";
  const subject = data.subject || "(no subject)";
  const emailId = data.email_id || null;

  // Parse from field
  let fromEmail = fromRaw;
  let fromName: string | null = null;

  if (typeof fromRaw === "string") {
    const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      fromName = match[1].trim().replace(/^["']|["']$/g, "");
      fromEmail = match[2].trim();
    }
  } else if (typeof fromRaw === "object" && fromRaw !== null) {
    fromEmail = fromRaw.email || fromRaw.address || "";
    fromName = fromRaw.name || null;
  }

  // Try multiple approaches to get email body
  let bodyText: string | null = null;
  let bodyHtml: string | null = null;
  let debugInfo = "";
  const resendKey = process.env.RESEND_API_KEY;

  // Approach 1: Check if body is in the webhook payload directly (some Resend versions include it)
  bodyHtml = data.html || data.body?.html || data.body_html || null;
  bodyText = data.text || data.body?.text || data.text_body || data.plain || data.body_text || null;

  // Approach 2: If not in webhook, try fetching from Resend inbound API
  if (!bodyHtml && !bodyText && emailId && resendKey) {
    // Try /inbound-emails/{id} first (Resend's inbound-specific endpoint)
    const endpoints = [
      `https://api.resend.com/inbound-emails/${emailId}`,
      `https://api.resend.com/emails/${emailId}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${resendKey}` },
        });
        const text = await res.text();
        if (res.ok) {
          try {
            const emailData = JSON.parse(text);
            bodyHtml = emailData.html || emailData.body?.html || emailData.body || null;
            bodyText = emailData.text || emailData.body?.text || null;
            if (bodyHtml || bodyText) {
              debugInfo = `[fetched from ${url}]`;
              break;
            }
            // Dump the response so we can see what fields exist
            debugInfo += `[${url} keys:${Object.keys(emailData).join(",")}] `;
          } catch { debugInfo += `[${url} parse error] `; }
        } else {
          debugInfo += `[${url} ${res.status}] `;
        }
      } catch (err) {
        debugInfo += `[${url} error:${String(err).slice(0, 100)}] `;
      }
    }
  }

  // Approach 3: Check all top-level payload keys for body content
  if (!bodyHtml && !bodyText) {
    // Dump all data keys and values for debugging
    const allKeys = Object.keys(data);
    const preview: Record<string, string> = {};
    for (const k of allKeys) {
      const v = data[k];
      if (typeof v === "string" && v.length > 20) {
        preview[k] = v.slice(0, 100);
      }
    }
    debugInfo += ` [dataKeys:${allKeys.join(",")}] [longValues:${JSON.stringify(preview)}]`;
  }

  const finalText = bodyText || (debugInfo ? debugInfo.trim() : null);

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText: finalText, bodyHtml },
  });

  return NextResponse.json({ received: true });
}

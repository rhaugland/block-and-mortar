import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const data = payload.data || payload;
  const eventType = payload.type || "email.received";

  if (eventType !== "email.received") {
    return NextResponse.json({ skipped: eventType });
  }

  const fromRaw = data.from || "";
  const subject = data.subject || "(no subject)";
  const emailId = data.email_id || "";

  // Parse from field
  let fromEmail = fromRaw;
  let fromName: string | null = null;
  if (typeof fromRaw === "string") {
    const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      fromName = match[1].trim().replace(/^["']|["']$/g, "");
      fromEmail = match[2].trim();
    }
  }

  // Check webhook payload for body first
  let bodyText: string | null = data.text || data.body || null;
  let bodyHtml: string | null = data.html || null;

  // If no body in webhook, fetch from Resend API: GET /inbounds/{id}
  if (!bodyText && !bodyHtml && emailId) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const endpoints = [
        `https://api.resend.com/inbounds/${emailId}`,
        `https://api.resend.com/emails/${emailId}`,
        `https://api.resend.com/inbound-emails/${emailId}`,
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${resendKey}` },
          });
          if (res.ok) {
            const emailData = await res.json();
            bodyHtml = emailData.html || emailData.body_html || emailData.body?.html || null;
            bodyText = emailData.text || emailData.body_text || emailData.body?.text || emailData.body || null;
            if (bodyHtml || bodyText) break;
            // Store keys for debugging if still nothing
            bodyText = `[${url} OK, keys:${Object.keys(emailData).join(",")}] ${JSON.stringify(emailData).slice(0, 500)}`;
            break;
          }
        } catch {}
      }
    }
  }

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText, bodyHtml },
  });

  return NextResponse.json({ received: true });
}

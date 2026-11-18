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

  // Fetch full email content from Resend API using email_id
  let bodyText: string | null = null;
  let bodyHtml: string | null = null;
  let debugInfo = "";

  if (emailId) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${resendKey}` },
        });
        const responseText = await res.text();
        debugInfo = `[status:${res.status}] ${responseText.slice(0, 500)}`;

        if (res.ok) {
          try {
            const emailData = JSON.parse(responseText);
            bodyHtml = emailData.html || emailData.body?.html || null;
            bodyText = emailData.text || emailData.body?.text || emailData.body || null;
            // If still nothing, dump all keys so we can find the content
            if (!bodyHtml && !bodyText) {
              debugInfo = `[keys: ${Object.keys(emailData).join(",")}] ${responseText.slice(0, 800)}`;
            }
          } catch { /* parse error */ }
        }
      } catch (err) {
        debugInfo = `[error] ${String(err)}`;
      }
    } else {
      debugInfo = "[no RESEND_API_KEY]";
    }
  } else {
    debugInfo = "[no email_id]";
  }

  // Store debug info as bodyText fallback if no content found
  const finalText = bodyText || debugInfo || null;

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText: finalText, bodyHtml },
  });

  console.log(`[INBOUND] Stored email from ${fromEmail}: ${subject}`);

  return NextResponse.json({ received: true });
}

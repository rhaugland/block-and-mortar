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

  if (emailId) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${resendKey}` },
        });
        if (res.ok) {
          const emailData = await res.json();
          bodyHtml = emailData.html || null;
          bodyText = emailData.text || emailData.body || null;
          console.log("[INBOUND] Fetched email content, hasHtml:", !!bodyHtml, "hasText:", !!bodyText);
        } else {
          console.log("[INBOUND] Failed to fetch email:", res.status, await res.text());
        }
      } catch (err) {
        console.log("[INBOUND] Error fetching email:", err);
      }
    }
  }

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText, bodyHtml },
  });

  console.log(`[INBOUND] Stored email from ${fromEmail}: ${subject}`);

  return NextResponse.json({ received: true });
}

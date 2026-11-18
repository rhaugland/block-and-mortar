import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const data = payload.data || payload;
  const eventType = payload.type || "email.received";

  if (eventType !== "email.received") {
    return NextResponse.json({ skipped: eventType });
  }

  const { from: fromEmail, subject: rawSubject, email_id, id: dataId } = data;
  const receivingId = email_id || dataId;
  const subject = rawSubject || "(no subject)";

  // Fetch full email content from Resend's receiving API
  let html = "";
  let text = "";
  let fullFrom = fromEmail || "";
  const resendKey = process.env.RESEND_API_KEY;

  if (receivingId && resendKey) {
    try {
      const res = await fetch(`https://api.resend.com/emails/receiving/${receivingId}`, {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      if (res.ok) {
        const full = await res.json();
        html = full.html || "";
        text = full.text || "";
        if (full.headers?.from) fullFrom = full.headers.from;
      }
    } catch {}
  }

  // Fallback: check if body is in the webhook payload directly
  if (!html && !text) {
    html = data.html || "";
    text = data.text || "";
  }

  // Parse sender
  const fromStr = typeof fullFrom === "string" ? fullFrom : String(fullFrom || "");
  let fromName: string | null = fromStr.replace(/<.*>/, "").replace(/"/g, "").trim() || null;
  const fromAddr = fromStr.match(/<(.+?)>/)?.[1] || fromStr.replace(/"/g, "").trim();

  await prisma.inboundEmail.create({
    data: {
      fromEmail: fromAddr || "unknown",
      fromName,
      subject,
      bodyText: text || null,
      bodyHtml: html || null,
    },
  });

  return NextResponse.json({ received: true });
}

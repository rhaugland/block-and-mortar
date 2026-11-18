import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Store the ENTIRE raw payload no matter what
  const raw = await req.text();

  let fromEmail = "unknown";
  let fromName: string | null = null;
  let subject = "(no subject)";
  let bodyText: string | null = null;
  let bodyHtml: string | null = null;

  try {
    const payload = JSON.parse(raw);
    const data = payload.data || payload;

    // Extract from
    const fromRaw = data.from || "";
    if (typeof fromRaw === "string") {
      const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        fromName = match[1].trim().replace(/^["']|["']$/g, "");
        fromEmail = match[2].trim();
      } else {
        fromEmail = fromRaw;
      }
    }

    subject = data.subject || "(no subject)";

    // Try every possible body field
    bodyHtml = data.html || data.body_html || data.htmlBody || null;
    bodyText = data.text || data.body_text || data.textBody || data.body || data.plain || data.content || null;

    // Try nested body object
    if (!bodyHtml && !bodyText && data.body && typeof data.body === "object") {
      bodyHtml = data.body.html || null;
      bodyText = data.body.text || null;
    }

    // Try fetching from API if no body
    if (!bodyHtml && !bodyText) {
      const emailId = data.email_id || "";
      const resendKey = process.env.RESEND_API_KEY;
      if (emailId && resendKey) {
        const results: string[] = [];
        for (const path of ["inbounds", "emails", "inbound-emails"]) {
          try {
            const res = await fetch(`https://api.resend.com/${path}/${emailId}`, {
              headers: { Authorization: `Bearer ${resendKey}` },
            });
            const txt = await res.text();
            results.push(`[${path}/${emailId} → ${res.status}] ${txt.slice(0, 300)}`);
            if (res.ok) {
              try {
                const d = JSON.parse(txt);
                if (d.html) bodyHtml = d.html;
                if (d.text) bodyText = d.text;
                if (d.body_html) bodyHtml = d.body_html;
                if (d.body_text) bodyText = d.body_text;
              } catch {}
            }
          } catch (e) {
            results.push(`[${path} error: ${String(e).slice(0, 100)}]`);
          }
        }
        if (!bodyHtml && !bodyText) {
          bodyText = `NO BODY FOUND.\n\nAPI results:\n${results.join("\n")}\n\nRaw webhook payload:\n${raw.slice(0, 1500)}`;
        }
      } else {
        bodyText = `NO BODY IN WEBHOOK. No API key or email_id.\n\nRaw payload:\n${raw.slice(0, 1500)}`;
      }
    }
  } catch {
    bodyText = `PARSE ERROR.\n\nRaw payload:\n${raw.slice(0, 1500)}`;
  }

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText, bodyHtml },
  });

  return NextResponse.json({ received: true });
}

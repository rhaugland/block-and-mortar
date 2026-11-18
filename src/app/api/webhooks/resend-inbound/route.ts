import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Resend sends inbound emails here as POST with JSON body
export async function POST(req: NextRequest) {
  const webhook_secret = process.env.RESEND_INBOUND_SECRET;
  if (webhook_secret) {
    const sig = req.headers.get("x-resend-signature") || req.headers.get("authorization");
    if (sig !== webhook_secret && sig !== `Bearer ${webhook_secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = await req.json();

  // Resend inbound webhook sends { from, to, subject, text, html, ... }
  const fromRaw = payload.from || "";
  const subject = payload.subject || "(no subject)";
  const bodyText = payload.text || null;
  const bodyHtml = payload.html || null;

  // Parse "Name <email>" format
  let fromEmail = fromRaw;
  let fromName: string | null = null;
  const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    fromName = match[1].trim();
    fromEmail = match[2].trim();
  }

  await prisma.inboundEmail.create({
    data: { fromEmail, fromName, subject, bodyText, bodyHtml },
  });

  return NextResponse.json({ received: true });
}

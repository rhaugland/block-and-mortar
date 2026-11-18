import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toEmail, toFirstName, toLastName, subject, bodyHtml } = await req.json();

  if (!toEmail || !subject || !bodyHtml) {
    return NextResponse.json({ error: "toEmail, subject, and bodyHtml are required" }, { status: 400 });
  }

  // Replace merge tags
  const mergedBody = bodyHtml
    .replace(/\{\{first_name\}\}/gi, toFirstName || "")
    .replace(/\{\{last_name\}\}/gi, toLastName || "");

  const mergedSubject = subject
    .replace(/\{\{first_name\}\}/gi, toFirstName || "")
    .replace(/\{\{last_name\}\}/gi, toLastName || "");

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ADMIN_FROM_EMAIL || "Ryan <ryan@blockandmortar.co>";
  let status = "sent";

  try {
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: mergedSubject,
          reply_to: "ryan@blockandmortar.co",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
              ${mergedBody}
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7e5e4;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1c1917;">Ryan Haugland</p>
                <p style="margin: 2px 0 0; font-size: 12px; color: #78716c;">Block &amp; Mortar</p>
                <p style="margin: 2px 0 0; font-size: 12px; color: #78716c;">ryan@blockandmortar.co</p>
              </div>
            </div>
          `,
        }),
      });
      if (!res.ok) status = "failed";
    } else {
      console.log(`[EMAIL] To: ${toEmail}\nSubject: ${mergedSubject}\n${mergedBody}`);
    }
  } catch {
    status = "failed";
  }

  const record = await prisma.outboundEmail.create({
    data: {
      toEmail,
      toFirstName: toFirstName || null,
      toLastName: toLastName || null,
      subject: mergedSubject,
      body: mergedBody.replace(/<[^>]*>/g, ""), // plain text fallback
      bodyHtml: mergedBody,
      status,
    },
  });

  return NextResponse.json({ success: status === "sent", email: record });
}

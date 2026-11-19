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
              ${mergedBody.replace(/<p(\s|>)/gi, '<p style="margin:0 0 24px 0;"$1')}
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7e5e4;">
                <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding-right: 14px; vertical-align: middle;">
                      <img src="https://www.blockandmortar.co/api/logo" alt="Block &amp; Mortar" width="140" height="32" style="display: block;" />
                    </td>
                    <td style="border-left: 2px solid #ff6b5b; padding-left: 14px; vertical-align: top;">
                      <p style="margin: 0; font-size: 14px; font-weight: 700; color: #1c1917;">Ryan Haugland</p>
                      <p style="margin: 2px 0 0; font-size: 12px; color: #78716c;">CEO, Block &amp; Mortar</p>
                      <p style="margin: 6px 0 0; font-size: 12px; color: #57534e;">
                        <a href="tel:6515282737" style="color: #57534e; text-decoration: none;">651-528-2737</a>
                      </p>
                      <p style="margin: 2px 0 0; font-size: 12px;">
                        <a href="mailto:ryan@blockandmortar.co" style="color: #ff6b5b; text-decoration: none;">ryan@blockandmortar.co</a>
                      </p>
                    </td>
                  </tr>
                </table>
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

  // Update lastContactedAt on the contact if they exist
  await prisma.contact.updateMany({
    where: { email: toEmail.toLowerCase() },
    data: { lastContactedAt: new Date() },
  }).catch(() => {});

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

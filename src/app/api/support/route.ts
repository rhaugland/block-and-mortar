import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message, name, email } = await req.json();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  // Save to database
  await prisma.supportTicket.create({
    data: {
      name: name || "Unknown",
      email: email || "",
      role: session.role,
      subject,
      message,
    },
  });

  // Also email notification
  const supportEmail = process.env.SUPPORT_EMAIL || "support@blockandmortar.co";

  await sendEmail({
    to: supportEmail,
    subject: `[Support] ${subject}`,
    replyTo: email || undefined,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
        <div style="background: linear-gradient(135deg, #ff6b5b, #fb923c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; color: #fff; font-size: 16px;">New Support Request</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c;">From</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1c1917;">${name || "Unknown"} &lt;${email || "no-email"}&gt;</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c;">Role</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1c1917;">${session.role}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c;">Subject</p>
          <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #1c1917;">${subject}</p>
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c;">Message</p>
          <p style="margin: 0; font-size: 14px; color: #1c1917; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}

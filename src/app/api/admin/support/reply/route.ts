import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId, reply } = await req.json();

  if (!ticketId || !reply) {
    return NextResponse.json({ error: "ticketId and reply are required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { reply, status: "replied", repliedAt: new Date() },
  });

  // Send reply email to the user
  await sendEmail({
    to: ticket.email,
    subject: `Re: ${ticket.subject}`,
    replyTo: process.env.SUPPORT_EMAIL || "support@blockandmortar.co",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
        <div style="background: linear-gradient(135deg, #ff6b5b, #fb923c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; color: #fff; font-size: 16px;">Block &amp; Mortar Support</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #78716c;">Hi ${ticket.name},</p>
          <p style="margin: 12px 0 20px; font-size: 14px; color: #1c1917; line-height: 1.6; white-space: pre-wrap;">${reply}</p>
          <div style="border-top: 1px solid #e7e5e4; padding-top: 16px; margin-top: 16px;">
            <p style="margin: 0 0 4px; font-size: 11px; color: #a8a29e;">Your original message:</p>
            <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.5; white-space: pre-wrap;">${ticket.message}</p>
          </div>
          <p style="margin: 20px 0 0; font-size: 12px; color: #a8a29e;">— The Block &amp; Mortar Team</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const REMIND_DAYS = [7, 3, 2];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://block-and-mortar.vercel.app";
  let campaignReminders = 0;
  let redeemReminders = 0;

  // ── 1. Campaign expiration reminders to businesses ──────────────

  for (const days of REMIND_DAYS) {
    const targetStart = new Date(now);
    targetStart.setDate(targetStart.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setDate(targetEnd.getDate() + 1);

    const expiringOffers = await prisma.offer.findMany({
      where: {
        active: true,
        expiresAt: { gte: targetStart, lt: targetEnd },
      },
      include: {
        business: { select: { name: true, email: true, contactName: true } },
      },
    });

    for (const offer of expiringOffers) {
      const name = offer.business.contactName || offer.business.name;
      await sendEmail({
        to: offer.business.email,
        subject: `Your offer "${offer.title}" expires in ${days} day${days > 1 ? "s" : ""}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
            <div style="background: linear-gradient(135deg, #ff6b5b, #fb923c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; color: #fff; font-size: 16px;">Campaign Expiring Soon</h2>
            </div>
            <div style="background: #fff; border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917;">Hi ${name},</p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917; line-height: 1.6;">
                Your offer <strong>&ldquo;${offer.title}&rdquo;</strong> will stop showing on apartment sites in <strong>${days} day${days > 1 ? "s" : ""}</strong>.
              </p>
              <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #78716c;">Offer</p>
                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1c1917;">${offer.title}</p>
                <p style="margin: 0 0 4px; font-size: 12px; color: #78716c;">Expires</p>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${days <= 2 ? "#ef4444" : "#1c1917"};">${offer.expiresAt!.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
              </div>
              <p style="margin: 0 0 16px; font-size: 13px; color: #78716c; line-height: 1.5;">
                ${days <= 2
                  ? "This is your last chance to extend it. After expiration, it will no longer appear on any apartment sites."
                  : "If your campaign is performing well, consider creating a new offer to keep the momentum going."}
              </p>
              <a href="${appUrl}/business/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none;">View Dashboard</a>
              <p style="margin: 20px 0 0; font-size: 12px; color: #a8a29e;">&mdash; The Block &amp; Mortar Team</p>
            </div>
          </div>
        `,
      });
      campaignReminders++;
    }
  }

  // ── 2. Redeem window reminders to users ─────────────────────────

  for (const days of REMIND_DAYS) {
    const targetStart = new Date(now);
    targetStart.setDate(targetStart.getDate() + days);
    targetStart.setHours(0, 0, 0, 0);

    const targetEnd = new Date(targetStart);
    targetEnd.setDate(targetEnd.getDate() + 1);

    const expiringRedemptions = await prisma.redemption.findMany({
      where: {
        redeemedAt: null,
        expiresAt: { gte: targetStart, lt: targetEnd },
      },
      include: {
        offer: { select: { title: true, description: true } },
        business: { select: { name: true } },
      },
    });

    for (const r of expiringRedemptions) {
      const redeemLink = `${appUrl}/redeem/${r.token}`;
      await sendEmail({
        to: r.email,
        subject: `Your perk from ${r.business.name} expires in ${days} day${days > 1 ? "s" : ""}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
            <div style="background: linear-gradient(135deg, #ff6b5b, #fb923c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; color: #fff; font-size: 16px;">Don&rsquo;t miss your perk!</h2>
            </div>
            <div style="background: #fff; border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917;">Hi ${r.firstName},</p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917; line-height: 1.6;">
                Your perk from <strong>${r.business.name}</strong> expires in <strong>${days} day${days > 1 ? "s" : ""}</strong>. Use it before it&rsquo;s gone!
              </p>
              <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1c1917;">${r.offer.title}</p>
                <p style="margin: 0 0 12px; font-size: 13px; color: #78716c;">${r.offer.description}</p>
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${days <= 2 ? "#ef4444" : "#fb923c"};">
                  Expires ${r.expiresAt!.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </div>
              <a href="${redeemLink}" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none;">Redeem Now</a>
              <p style="margin: 20px 0 0; font-size: 11px; color: #a8a29e;">Powered by Block &amp; Mortar</p>
            </div>
          </div>
        `,
      });
      redeemReminders++;
    }
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    campaignReminders,
    redeemReminders,
  });
}

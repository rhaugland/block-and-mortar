import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndChargeInvoice, PLATFORM_FEE_CENTS } from "@/lib/stripe";
import { sendVisaReward } from "@/lib/tremendous";

// Vercel Cron calls this with Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = now;

  const businessResults: { businessId: string; name: string; amountCents: number; status: string; error?: string }[] = [];
  const propertyResults: { propertyId: string; name: string; amountCents: number; status: string; error?: string }[] = [];

  // ── STEP 1: Charge businesses for unpaid clicks ──────────────────

  const businesses = await prisma.business.findMany({
    where: { stripeCustomerId: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      stripeCustomerId: true,
    },
  });

  for (const biz of businesses) {
    // Find last successful invoice for this business
    const lastInvoice = await prisma.invoice.findFirst({
      where: { businessId: biz.id, status: "paid" },
      orderBy: { periodEnd: "desc" },
    });

    const periodStart = lastInvoice?.periodEnd || new Date("2020-01-01");

    // Get clicks with their CPC rates since last invoice
    const clicks = await prisma.click.findMany({
      where: {
        businessId: biz.id,
        createdAt: { gt: periodStart, lte: periodEnd },
      },
      select: { offerId: true },
    });

    // Group clicks by offer to calculate per-offer CPC
    const clicksByOffer: Record<string, number> = {};
    for (const c of clicks) {
      clicksByOffer[c.offerId] = (clicksByOffer[c.offerId] || 0) + 1;
    }

    // Get CPC rates for each offer
    const offerIds = Object.keys(clicksByOffer);
    const offers = offerIds.length > 0
      ? await prisma.offer.findMany({
          where: { id: { in: offerIds } },
          select: { id: true, cpcCents: true },
        })
      : [];

    const cpcMap: Record<string, number> = {};
    for (const o of offers) cpcMap[o.id] = o.cpcCents;

    // Calculate click charges
    let clickCents = 0;
    for (const [offerId, count] of Object.entries(clicksByOffer)) {
      clickCents += count * (cpcMap[offerId] || 50);
    }

    // Get featured boost charges for this period
    const boosts = await prisma.featuredBoost.findMany({
      where: {
        businessId: biz.id,
        status: "active",
        date: { gt: periodStart, lte: periodEnd },
      },
    });
    const boostCents = boosts.reduce((sum, b) => sum + b.amountCents, 0);

    // Total = platform fee + click charges + boosts
    const totalCents = PLATFORM_FEE_CENTS + clickCents + boostCents;

    // Create Stripe invoice (always includes platform fee)
    const result = await createAndChargeInvoice({
      customerId: biz.stripeCustomerId!,
      businessName: biz.name,
      amountCents: clickCents,
      clickCount: clicks.length,
      periodStart,
      periodEnd,
      includePlatformFee: true,
      extraLineItems: boostCents > 0 ? [{
        amountCents: boostCents,
        description: `Block & Mortar — ${boosts.length} Featured Boost day${boosts.length > 1 ? "s" : ""} × $${(boosts[0]?.amountCents / 100 || 25).toFixed(0)}/day`,
      }] : [],
    });

    // Record invoice in DB
    const savedInvoice = await prisma.invoice.create({
      data: {
        businessId: biz.id,
        amountCents: totalCents,
        clickCents: clickCents,
        boostCents: boostCents,
        clickCount: clicks.length,
        periodStart,
        periodEnd,
        stripeInvoiceId: result.invoiceId || null,
        stripeHostedUrl: result.hostedUrl || null,
        status: result.success ? "paid" : "failed",
        failReason: result.error || null,
      },
    });

    // Send billing summary email
    if (result.success && process.env.RESEND_API_KEY) {
      const periodLabel = periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const boostCount = boosts.length;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.ADMIN_FROM_EMAIL || "Block & Mortar <ryan@blockandmortar.co>",
            to: biz.email,
            subject: `Your Block & Mortar statement — ${periodLabel}`,
            reply_to: "ryan@blockandmortar.co",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; color: #1c1917;">
                <div style="margin-bottom: 24px;">
                  <img src="https://www.blockandmortar.co/api/logo" alt="Block &amp; Mortar" width="140" height="28" style="display:block;" />
                </div>
                <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 4px;">Monthly Statement</h2>
                <p style="font-size: 14px; color: #78716c; margin: 0 0 24px;">${periodLabel}</p>

                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; color: #57534e;">Platform access fee</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; text-align: right; color: #1c1917;">$10.00</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; color: #57534e;">${clicks.length} click${clicks.length !== 1 ? "s" : ""} claimed</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; text-align: right; color: #1c1917;">$${(clickCents / 100).toFixed(2)}</td>
                  </tr>
                  ${boostCount > 0 ? `<tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; color: #57534e;">${boostCount} featured boost day${boostCount !== 1 ? "s" : ""}</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e7e5e4; font-size: 14px; text-align: right; color: #1c1917;">$${(boostCents / 100).toFixed(2)}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="padding: 16px 0 4px; font-size: 16px; font-weight: 700; color: #1c1917;">Total charged</td>
                    <td style="padding: 16px 0 4px; font-size: 16px; font-weight: 700; text-align: right; color: #ff6b5b;">$${(totalCents / 100).toFixed(2)}</td>
                  </tr>
                </table>

                <p style="font-size: 13px; color: #78716c; margin: 0 0 20px;">
                  This amount has been charged to your card on file.
                  ${result.hostedUrl ? `<a href="${result.hostedUrl}" style="color: #ff6b5b;">View full invoice &rarr;</a>` : ""}
                </p>

                <a href="https://www.blockandmortar.co/business/dashboard/billing" style="display:inline-block; background:#ff6b5b; color:white; text-decoration:none; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:600;">View billing dashboard</a>

                <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7e5e4;">
                  <p style="font-size: 12px; color: #a8a29e; margin: 0;">Questions? Reply to this email or contact ryan@blockandmortar.co</p>
                </div>
              </div>
            `,
          }),
        });
        await prisma.invoice.update({ where: { id: savedInvoice.id }, data: { emailSentAt: new Date() } });
      } catch (emailErr) {
        console.error("[billing] Failed to send billing email:", emailErr);
      }
    }

    // Update spentCents on each offer
    if (result.success) {
      for (const [offerId, count] of Object.entries(clicksByOffer)) {
        const addCents = count * (cpcMap[offerId] || 50);
        await prisma.offer.update({
          where: { id: offerId },
          data: { spentCents: { increment: addCents } },
        });
      }
    }

    businessResults.push({
      businessId: biz.id,
      name: biz.name,
      amountCents: totalCents,
      status: result.success ? "paid" : "failed",
      error: result.error,
    });
  }

  // ── STEP 2: Pay out properties via Tremendous ────────────────────

  const properties = await prisma.property.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      contactName: true,
      revSharePct: true,
    },
  });

  for (const prop of properties) {
    const lastPayout = await prisma.payout.findFirst({
      where: { propertyId: prop.id, status: "sent" },
      orderBy: { periodEnd: "desc" },
    });

    const payoutStart = lastPayout?.periodEnd || new Date("2020-01-01");

    const clickCount = await prisma.click.count({
      where: {
        propertyId: prop.id,
        createdAt: { gt: payoutStart, lte: periodEnd },
      },
    });

    if (clickCount === 0) {
      propertyResults.push({ propertyId: prop.id, name: prop.name, amountCents: 0, status: "skipped" });
      continue;
    }

    const cpcCents = 50;
    const amountCents = Math.round(clickCount * cpcCents * prop.revSharePct);

    if (amountCents < 100) {
      propertyResults.push({ propertyId: prop.id, name: prop.name, amountCents, status: "below_minimum" });
      continue;
    }

    const reward = await sendVisaReward({
      email: prop.email,
      name: prop.contactName || prop.name,
      amountCents,
      memo: `Block & Mortar payout: ${clickCount} claims × $${(cpcCents / 100).toFixed(2)} CPC × ${Math.round(prop.revSharePct * 100)}% rev share`,
    });

    await prisma.payout.create({
      data: {
        propertyId: prop.id,
        amountCents,
        clickCount,
        periodStart: payoutStart,
        periodEnd,
        tremendousId: reward.orderId || null,
        tremendousLink: reward.rewardLink || null,
        status: reward.success ? "sent" : "failed",
        failReason: reward.error || null,
      },
    });

    propertyResults.push({
      propertyId: prop.id,
      name: prop.name,
      amountCents,
      status: reward.success ? "sent" : "failed",
      error: reward.error,
    });
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    businesses: businessResults,
    properties: propertyResults,
  });
}

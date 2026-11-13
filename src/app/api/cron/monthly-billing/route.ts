import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndChargeInvoice } from "@/lib/stripe";
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

    if (clicks.length === 0) {
      businessResults.push({ businessId: biz.id, name: biz.name, amountCents: 0, status: "skipped" });
      continue;
    }

    // Group clicks by offer to calculate per-offer CPC
    const clicksByOffer: Record<string, number> = {};
    for (const c of clicks) {
      clicksByOffer[c.offerId] = (clicksByOffer[c.offerId] || 0) + 1;
    }

    // Get CPC rates for each offer
    const offerIds = Object.keys(clicksByOffer);
    const offers = await prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, cpcCents: true },
    });

    const cpcMap: Record<string, number> = {};
    for (const o of offers) cpcMap[o.id] = o.cpcCents;

    // Calculate total charge
    let totalCents = 0;
    for (const [offerId, count] of Object.entries(clicksByOffer)) {
      totalCents += count * (cpcMap[offerId] || 50);
    }

    if (totalCents < 100) {
      businessResults.push({ businessId: biz.id, name: biz.name, amountCents: totalCents, status: "below_minimum" });
      continue;
    }

    // Create Stripe invoice
    const result = await createAndChargeInvoice({
      customerId: biz.stripeCustomerId!,
      businessName: biz.name,
      amountCents: totalCents,
      clickCount: clicks.length,
      periodStart,
      periodEnd,
    });

    // Record invoice in DB
    await prisma.invoice.create({
      data: {
        businessId: biz.id,
        amountCents: totalCents,
        clickCount: clicks.length,
        periodStart,
        periodEnd,
        stripeInvoiceId: result.invoiceId || null,
        stripeHostedUrl: result.hostedUrl || null,
        status: result.success ? "paid" : "failed",
        failReason: result.error || null,
      },
    });

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

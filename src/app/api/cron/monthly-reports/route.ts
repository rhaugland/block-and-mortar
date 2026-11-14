import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildAdminReport, buildPropertyReport, buildBusinessReport } from "@/lib/report-emails";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blockandmortar.co";
  const now = new Date();
  const monthLabel = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Period: previous calendar month
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const sent: string[] = [];

  // ── Admin Report ──────────────────────────────────────────
  const adminEmail = process.env.ADMIN_REPORT_EMAIL;
  if (adminEmail) {
    const [totalBusinesses, totalProperties, newBusinesses, newProperties, clicks, redemptions] = await Promise.all([
      prisma.business.count(),
      prisma.property.count(),
      prisma.business.count({ where: { createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.property.count({ where: { createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.click.count({ where: { createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.redemption.count({ where: { redeemedAt: { gte: periodStart, lt: periodEnd } } }),
    ]);

    const businesses = await prisma.business.findMany({
      select: { name: true, offers: { select: { spentCents: true, expiresAt: true, title: true, active: true } } },
    });

    const topBusinesses = businesses
      .map((b) => ({ name: b.name, spentCents: b.offers.reduce((s, o) => s + o.spentCents, 0) }))
      .sort((a, b) => b.spentCents - a.spentCents)
      .filter((b) => b.spentCents > 0);

    const expiringOffers: { title: string; businessName: string; daysLeft: number }[] = [];
    for (const b of businesses) {
      for (const o of b.offers) {
        if (!o.expiresAt || !o.active) continue;
        const diff = o.expiresAt.getTime() - now.getTime();
        const daysLeft = Math.ceil(diff / 86400000);
        if (daysLeft >= 0 && daysLeft <= 7) {
          expiringOffers.push({ title: o.title, businessName: b.name, daysLeft });
        }
      }
    }

    const revenueCents = businesses.reduce((s, b) => s + b.offers.reduce((s2, o) => s2 + o.spentCents, 0), 0);
    const payoutsCents = (await prisma.payout.aggregate({ where: { status: "sent" }, _sum: { amountCents: true } }))._sum.amountCents || 0;

    const { subject, html } = buildAdminReport({
      month: monthLabel,
      totalBusinesses,
      totalProperties,
      newBusinesses,
      newProperties,
      totalClaims: clicks,
      totalRedemptions: redemptions,
      revenueCents,
      payoutsCents,
      profitCents: revenueCents - payoutsCents,
      topBusinesses,
      expiringOffers,
      appUrl,
    });

    await sendEmail({ to: adminEmail, subject, html });
    sent.push(`admin:${adminEmail}`);
  }

  // ── Property Reports ──────────────────────────────────────
  const properties = await prisma.property.findMany({
    where: { monthlyReport: true },
    select: {
      id: true,
      name: true,
      email: true,
      widgetEnabled: true,
      widgetLastPing: true,
      revSharePct: true,
    },
  });

  for (const prop of properties) {
    const [claims, redemptions] = await Promise.all([
      prisma.click.count({ where: { propertyId: prop.id, createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.redemption.count({ where: { propertyId: prop.id, redeemedAt: { gte: periodStart, lt: periodEnd } } }),
    ]);

    const lastPayout = await prisma.payout.findFirst({
      where: { propertyId: prop.id, status: "sent" },
      orderBy: { createdAt: "desc" },
      select: { amountCents: true },
    });

    const revenueCents = Math.round(claims * 50 * prop.revSharePct);

    let widgetStatus: "active" | "inactive" | "not_installed" | "hidden" = "not_installed";
    if (!prop.widgetEnabled) widgetStatus = "hidden";
    else if (prop.widgetLastPing && (now.getTime() - prop.widgetLastPing.getTime()) < 86400000) widgetStatus = "active";
    else if (prop.widgetLastPing) widgetStatus = "inactive";

    // Top offers for this property
    const topOffers = await prisma.click.groupBy({
      by: ["offerId"],
      where: { propertyId: prop.id, createdAt: { gte: periodStart, lt: periodEnd } },
      _count: true,
      orderBy: { _count: { offerId: "desc" } },
      take: 5,
    });

    const offerDetails = topOffers.length > 0
      ? await prisma.offer.findMany({
          where: { id: { in: topOffers.map((o) => o.offerId) } },
          select: { id: true, title: true, business: { select: { name: true } } },
        })
      : [];

    const offerMap = Object.fromEntries(offerDetails.map((o) => [o.id, o]));

    const { subject, html } = buildPropertyReport({
      month: monthLabel,
      propertyName: prop.name,
      totalClaims: claims,
      totalRedemptions: redemptions,
      revenueCents,
      lastPayoutCents: lastPayout?.amountCents ?? null,
      widgetStatus,
      topOffers: topOffers.map((o) => ({
        title: offerMap[o.offerId]?.title || "Unknown",
        businessName: offerMap[o.offerId]?.business.name || "Unknown",
        claims: o._count,
      })),
      appUrl,
    });

    await sendEmail({ to: prop.email, subject, html });
    sent.push(`property:${prop.email}`);
  }

  // ── Business Reports ──────────────────────────────────────
  const bizList = await prisma.business.findMany({
    where: { monthlyReport: true },
    select: {
      id: true,
      name: true,
      email: true,
      budgetCents: true,
      offers: {
        select: {
          title: true,
          active: true,
          spentCents: true,
          _count: { select: { clicks: true, redemptions: true } },
        },
      },
    },
  });

  for (const biz of bizList) {
    const [impressions, claims, redemptions] = await Promise.all([
      prisma.impression.count({ where: { businessId: biz.id, createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.click.count({ where: { businessId: biz.id, createdAt: { gte: periodStart, lt: periodEnd } } }),
      prisma.redemption.count({ where: { businessId: biz.id, redeemedAt: { gte: periodStart, lt: periodEnd } } }),
    ]);

    const spentCents = biz.offers.reduce((s, o) => s + o.spentCents, 0);

    const { subject, html } = buildBusinessReport({
      month: monthLabel,
      businessName: biz.name,
      totalImpressions: impressions,
      totalClaims: claims,
      totalRedemptions: redemptions,
      spentCents,
      budgetCents: biz.budgetCents,
      offers: biz.offers.map((o) => ({
        title: o.title,
        claims: o._count.clicks,
        redemptions: o._count.redemptions,
        active: o.active,
        spentCents: o.spentCents,
      })),
      appUrl,
    });

    await sendEmail({ to: biz.email, subject, html });
    sent.push(`business:${biz.email}`);
  }

  return NextResponse.json({ sent, count: sent.length });
}

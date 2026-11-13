import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [properties, businesses, offers, clicksByProperty, totalClicks, totalImpressions, redemptionCount] = await Promise.all([
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        email: true,
        widgetEnabled: true,
        widgetLastPing: true,
        revSharePct: true,
        createdAt: true,
        _count: { select: { impressions: true, clicks: true, redemptions: true, locations: true } },
      },
    }),
    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        city: true,
        state: true,
        email: true,
        budgetCents: true,
        createdAt: true,
        _count: { select: { offers: true, clicks: true, redemptions: true } },
        offers: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            active: true,
            radiusMiles: true,
            budgetCents: true,
            spentCents: true,
            cpcCents: true,
            startsAt: true,
            expiresAt: true,
            createdAt: true,
            _count: { select: { impressions: true, clicks: true, redemptions: true } },
          },
        },
      },
    }),
    prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        active: true,
        radiusMiles: true,
        budgetCents: true,
        spentCents: true,
        cpcCents: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        business: { select: { id: true, name: true } },
        _count: { select: { impressions: true, clicks: true, redemptions: true } },
      },
    }),
    // Clicks grouped by property for payout calculations
    prisma.click.groupBy({
      by: ["propertyId"],
      _count: { id: true },
    }),
    prisma.click.count(),
    prisma.impression.count(),
    prisma.redemption.count(),
  ]);

  // Calculate business spending
  const businessesWithSpent = businesses.map((b) => {
    const totalSpent = b.offers.reduce((sum, o) => sum + o.spentCents, 0);
    return {
      id: b.id,
      name: b.name,
      category: b.category,
      address: b.address,
      city: b.city,
      state: b.state,
      email: b.email,
      budgetCents: b.budgetCents,
      spentCents: totalSpent,
      offerCount: b._count.offers,
      clickCount: b._count.clicks,
      redemptionCount: b._count.redemptions,
      createdAt: b.createdAt,
      offers: b.offers,
    };
  });

  // Total platform revenue (sum of all business spend)
  const totalRevenueCents = businessesWithSpent.reduce((s, b) => s + b.spentCents, 0);

  // Property payouts owed: each click = $0.50 CPC * property revSharePct
  const propertyMap = new Map(properties.map((p) => [p.id, p]));
  const propertyPayouts = clicksByProperty.map((group) => {
    const prop = propertyMap.get(group.propertyId);
    const clickCount = group._count.id;
    const cpcCents = 50; // $0.50
    const revShare = prop?.revSharePct ?? 0.25;
    const owedCents = Math.round(clickCount * cpcCents * revShare);
    return {
      propertyId: group.propertyId,
      propertyName: prop?.name ?? "Unknown",
      clickCount,
      revSharePct: revShare,
      owedCents,
    };
  });

  const totalOwedCents = propertyPayouts.reduce((s, p) => s + p.owedCents, 0);

  return NextResponse.json({
    stats: {
      totalProperties: properties.length,
      totalBusinesses: businesses.length,
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => o.active).length,
      totalImpressions,
      totalClicks,
      totalRedemptions: redemptionCount,
      totalRevenueCents,
      totalOwedCents,
      netRevenueCents: totalRevenueCents - totalOwedCents,
    },
    properties: properties.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      email: p.email,
      widgetEnabled: p.widgetEnabled,
      widgetLastPing: p.widgetLastPing,
      revSharePct: p.revSharePct,
      locationCount: p._count.locations,
      impressionCount: p._count.impressions,
      clickCount: p._count.clicks,
      redemptionCount: p._count.redemptions,
      createdAt: p.createdAt,
    })),
    businesses: businessesWithSpent,
    offers,
    propertyPayouts,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildPropertyReport } from "@/lib/report-emails";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "property") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const property = await prisma.property.findUnique({
    where: { id: session.id },
    select: { monthlyReport: true },
  });
  return NextResponse.json({ enabled: property?.monthlyReport ?? false });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "property") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { enabled } = await req.json();
  const property = await prisma.property.update({
    where: { id: session.id },
    data: { monthlyReport: !!enabled },
    select: { id: true, name: true, email: true, widgetEnabled: true, widgetLastPing: true, revSharePct: true },
  });

  // Send a sample report when toggling ON
  if (enabled) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blockandmortar.co";
    const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const now = new Date();

    const [claims, redemptions] = await Promise.all([
      prisma.click.count({ where: { propertyId: property.id } }),
      prisma.redemption.count({ where: { propertyId: property.id, redeemedAt: { not: null } } }),
    ]);

    const lastPayout = await prisma.payout.findFirst({
      where: { propertyId: property.id, status: "sent" },
      orderBy: { createdAt: "desc" },
      select: { amountCents: true },
    });

    let widgetStatus: "active" | "inactive" | "not_installed" | "hidden" = "not_installed";
    if (!property.widgetEnabled) widgetStatus = "hidden";
    else if (property.widgetLastPing && (now.getTime() - property.widgetLastPing.getTime()) < 86400000) widgetStatus = "active";
    else if (property.widgetLastPing) widgetStatus = "inactive";

    const topOfferData = await prisma.click.groupBy({
      by: ["offerId"],
      where: { propertyId: property.id },
      _count: true,
      orderBy: { _count: { offerId: "desc" } },
      take: 5,
    });

    const offerDetails = topOfferData.length > 0
      ? await prisma.offer.findMany({
          where: { id: { in: topOfferData.map((o) => o.offerId) } },
          select: { id: true, title: true, business: { select: { name: true } } },
        })
      : [];
    const offerMap = Object.fromEntries(offerDetails.map((o) => [o.id, o]));

    const { subject, html } = buildPropertyReport({
      month,
      propertyName: property.name,
      totalClaims: claims,
      totalRedemptions: redemptions,
      revenueCents: Math.round(claims * 50 * property.revSharePct),
      lastPayoutCents: lastPayout?.amountCents ?? null,
      widgetStatus,
      topOffers: topOfferData.map((o) => ({
        title: offerMap[o.offerId]?.title || "Unknown",
        businessName: offerMap[o.offerId]?.business.name || "Unknown",
        claims: o._count,
      })),
      appUrl,
    });

    sendEmail({ to: property.email, subject: `[Sample] ${subject}`, html }).catch(() => {});
  }

  return NextResponse.json({ enabled: !!enabled });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildAdminReport } from "@/lib/report-emails";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: !!process.env.ADMIN_REPORT_EMAIL });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_REPORT_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ enabled: false });
  }

  // Send a sample admin report with real data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blockandmortar.co";
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const now = new Date();

  const [totalBusinesses, totalProperties, clicks, redemptions] = await Promise.all([
    prisma.business.count(),
    prisma.property.count(),
    prisma.click.count(),
    prisma.redemption.count({ where: { redeemedAt: { not: null } } }),
  ]);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const [newBusinesses, newProperties] = await Promise.all([
    prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.property.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
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
      const daysLeft = Math.ceil((o.expiresAt.getTime() - now.getTime()) / 86400000);
      if (daysLeft >= 0 && daysLeft <= 7) {
        expiringOffers.push({ title: o.title, businessName: b.name, daysLeft });
      }
    }
  }

  const revenueCents = businesses.reduce((s, b) => s + b.offers.reduce((s2, o) => s2 + o.spentCents, 0), 0);
  const payoutsCents = (await prisma.payout.aggregate({ where: { status: "sent" }, _sum: { amountCents: true } }))._sum.amountCents || 0;

  const { subject, html } = buildAdminReport({
    month,
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

  sendEmail({ to: adminEmail, subject: `[Sample] ${subject}`, html }).catch(() => {});

  return NextResponse.json({ enabled: true });
}

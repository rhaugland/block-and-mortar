import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildBusinessReport } from "@/lib/report-emails";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = await prisma.business.findUnique({
    where: { id: session.id },
    select: { monthlyReport: true },
  });
  return NextResponse.json({ enabled: business?.monthlyReport ?? false });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { enabled } = await req.json();
  const business = await prisma.business.update({
    where: { id: session.id },
    data: { monthlyReport: !!enabled },
    select: { id: true, name: true, email: true, budgetCents: true },
  });

  // Send a sample report when toggling ON
  if (enabled) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blockandmortar.co";
    const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const [impressions, claims, redemptions] = await Promise.all([
      prisma.impression.count({ where: { businessId: business.id } }),
      prisma.click.count({ where: { businessId: business.id } }),
      prisma.redemption.count({ where: { businessId: business.id, redeemedAt: { not: null } } }),
    ]);

    const offers = await prisma.offer.findMany({
      where: { businessId: business.id },
      select: {
        title: true,
        active: true,
        spentCents: true,
        _count: { select: { clicks: true, redemptions: true } },
      },
    });

    const spentCents = offers.reduce((s, o) => s + o.spentCents, 0);

    const { subject, html } = buildBusinessReport({
      month,
      businessName: business.name,
      totalImpressions: impressions,
      totalClaims: claims,
      totalRedemptions: redemptions,
      spentCents,
      budgetCents: business.budgetCents,
      offers: offers.map((o) => ({
        title: o.title,
        claims: o._count.clicks,
        redemptions: o._count.redemptions,
        active: o.active,
        spentCents: o.spentCents,
      })),
      appUrl,
    });

    sendEmail({ to: business.email, subject: `[Sample] ${subject}`, html }).catch(() => {});
  }

  return NextResponse.json({ enabled: !!enabled });
}

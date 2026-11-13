import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVisaReward } from "@/lib/tremendous";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ payouts });
}

// POST: trigger payouts for all properties with unpaid balances
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId } = await req.json().catch(() => ({ propertyId: null }));

  const now = new Date();
  const periodEnd = now;
  // Period start = last payout date for this property, or beginning of time

  // Get all properties (or just one if specified)
  const properties = await prisma.property.findMany({
    where: propertyId ? { id: propertyId } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      contactName: true,
      revSharePct: true,
    },
  });

  const results: { propertyId: string; propertyName: string; amountCents: number; status: string; error?: string }[] = [];

  for (const property of properties) {
    // Find the last successful payout for this property
    const lastPayout = await prisma.payout.findFirst({
      where: { propertyId: property.id, status: "sent" },
      orderBy: { periodEnd: "desc" },
    });

    const periodStart = lastPayout?.periodEnd || new Date("2020-01-01");

    // Count clicks since last payout
    const clickCount = await prisma.click.count({
      where: {
        propertyId: property.id,
        createdAt: { gt: periodStart, lte: periodEnd },
      },
    });

    if (clickCount === 0) {
      results.push({ propertyId: property.id, propertyName: property.name, amountCents: 0, status: "skipped" });
      continue;
    }

    // Calculate payout: clicks * $0.50 CPC * revSharePct
    const cpcCents = 50;
    const amountCents = Math.round(clickCount * cpcCents * property.revSharePct);

    if (amountCents < 100) {
      // Minimum $1.00 payout threshold
      results.push({ propertyId: property.id, propertyName: property.name, amountCents, status: "below_minimum" });
      continue;
    }

    // Send via Tremendous
    const reward = await sendVisaReward({
      email: property.email,
      name: property.contactName || property.name,
      amountCents,
      memo: `Block & Mortar payout: ${clickCount} claims × $${(cpcCents / 100).toFixed(2)} CPC × ${Math.round(property.revSharePct * 100)}% rev share`,
    });

    // Record the payout
    const payout = await prisma.payout.create({
      data: {
        propertyId: property.id,
        amountCents,
        clickCount,
        periodStart,
        periodEnd,
        tremendousId: reward.orderId || null,
        tremendousLink: reward.rewardLink || null,
        status: reward.success ? "sent" : "failed",
        failReason: reward.error || null,
      },
    });

    results.push({
      propertyId: property.id,
      propertyName: property.name,
      amountCents,
      status: payout.status,
      error: reward.error,
    });
  }

  return NextResponse.json({ results });
}

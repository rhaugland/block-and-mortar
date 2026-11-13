import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Last 30 days
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [businesses, properties, clicks, redemptions] = await Promise.all([
    prisma.business.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.property.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.click.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.redemption.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, redeemedAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Also get totals before the window for cumulative
  const [bizBefore, propBefore] = await Promise.all([
    prisma.business.count({ where: { createdAt: { lt: since } } }),
    prisma.property.count({ where: { createdAt: { lt: since } } }),
  ]);

  // Build daily buckets
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const toDay = (d: Date) => d.toISOString().slice(0, 10);

  // Count per day
  const bizPerDay: Record<string, number> = {};
  const propPerDay: Record<string, number> = {};
  const claimPerDay: Record<string, number> = {};
  const redeemPerDay: Record<string, number> = {};

  for (const b of businesses) bizPerDay[toDay(b.createdAt)] = (bizPerDay[toDay(b.createdAt)] || 0) + 1;
  for (const p of properties) propPerDay[toDay(p.createdAt)] = (propPerDay[toDay(p.createdAt)] || 0) + 1;
  for (const c of clicks) claimPerDay[toDay(c.createdAt)] = (claimPerDay[toDay(c.createdAt)] || 0) + 1;
  for (const r of redemptions) {
    if (r.redeemedAt) redeemPerDay[toDay(r.redeemedAt)] = (redeemPerDay[toDay(r.redeemedAt)] || 0) + 1;
  }

  // Build cumulative signup series
  let bizCum = bizBefore;
  let propCum = propBefore;
  const signups = days.map((day) => {
    bizCum += bizPerDay[day] || 0;
    propCum += propPerDay[day] || 0;
    return { day, businesses: bizCum, properties: propCum };
  });

  // Build daily claims/redeems series
  const activity = days.map((day) => ({
    day,
    claims: claimPerDay[day] || 0,
    redeemed: redeemPerDay[day] || 0,
  }));

  return NextResponse.json({ signups, activity });
}

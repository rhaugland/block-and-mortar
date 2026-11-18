import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const BOOST_RATE_CENTS = 2500; // $25/day

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boosts = await prisma.featuredBoost.findMany({
    where: { businessId: session.id },
    include: { offer: { select: { title: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ boosts, rateCents: BOOST_RATE_CENTS });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId, dates } = await req.json();

  if (!offerId || !dates || !Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: "offerId and dates[] are required" }, { status: 400 });
  }

  // Verify offer belongs to this business
  const offer = await prisma.offer.findFirst({
    where: { id: offerId, businessId: session.id },
  });
  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  // Check for existing boosts on these dates for this offer
  const existing = await prisma.featuredBoost.findMany({
    where: {
      offerId,
      date: { in: dates.map((d: string) => new Date(d)) },
      status: "active",
    },
  });
  const existingDates = new Set(existing.map((b) => b.date.toISOString().split("T")[0]));
  const newDates = dates.filter((d: string) => !existingDates.has(d));

  if (newDates.length === 0) {
    return NextResponse.json({ error: "All selected dates are already boosted" }, { status: 409 });
  }

  const boosts = await prisma.featuredBoost.createManyAndReturn({
    data: newDates.map((d: string) => ({
      offerId,
      businessId: session.id,
      date: new Date(d),
      amountCents: BOOST_RATE_CENTS,
    })),
  });

  const totalCents = newDates.length * BOOST_RATE_CENTS;

  return NextResponse.json({
    success: true,
    booked: newDates.length,
    totalCents,
    boosts,
  });
}

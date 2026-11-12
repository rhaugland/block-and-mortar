import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        apiKey: true,
        widgetEnabled: true,
        widgetLastPing: true,
        widgetStyle: true,
        revSharePct: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const [totalImpressions, totalClicks] = await Promise.all([
      prisma.impression.count({ where: { propertyId: property.id } }),
      prisma.click.count({ where: { propertyId: property.id } }),
    ]);

    // Calculate revenue: sum of click CPC * property rev share
    const clicks = await prisma.click.findMany({
      where: { propertyId: property.id },
      select: { offer: { select: { cpcCents: true } } },
    });

    const revenueCents = clicks.reduce(
      (sum, c) => sum + Math.round(c.offer.cpcCents * property.revSharePct),
      0
    );

    return NextResponse.json({
      property,
      stats: {
        totalImpressions,
        totalClicks,
        revenueCents,
      },
    });
  } catch (err) {
    console.error("Property dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

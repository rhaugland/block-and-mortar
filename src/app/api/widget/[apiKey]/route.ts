import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { distanceMiles } from "@/lib/geo";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  try {
    const { apiKey } = await params;
    const property = await prisma.property.findUnique({
      where: { apiKey },
      include: { locations: { select: { lat: true, lng: true } } },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!property.widgetEnabled) {
      return NextResponse.json({ offers: [], style: null }, { headers: corsHeaders });
    }

    // Use all locations (fall back to property's own lat/lng if no locations)
    const coords = property.locations.length > 0
      ? property.locations
      : [{ lat: property.lat, lng: property.lng }];

    const now = new Date();
    const offers = await prisma.offer.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            logoUrl: true,
            lat: true,
            lng: true,
            budgetCents: true,
          },
        },
      },
    });

    // Get total spent per business (account-level budget check)
    const businessIds = [...new Set(offers.map((o) => o.business.id))];
    const spentByBusiness: Record<string, number> = {};
    if (businessIds.length > 0) {
      const spentData = await prisma.offer.groupBy({
        by: ["businessId"],
        where: { businessId: { in: businessIds } },
        _sum: { spentCents: true },
      });
      for (const row of spentData) {
        spentByBusiness[row.businessId] = row._sum.spentCents || 0;
      }
    }

    // Filter by radius and business budget — match if near ANY location
    const nearby = offers.filter((offer) => {
      const totalSpent = spentByBusiness[offer.business.id] || 0;
      if (offer.business.budgetCents > 0 && totalSpent >= offer.business.budgetCents) return false;
      return coords.some((loc) => {
        const dist = distanceMiles(loc.lat, loc.lng, offer.business.lat, offer.business.lng);
        return dist <= offer.radiusMiles;
      });
    });

    // Record impressions
    if (nearby.length > 0) {
      await prisma.impression.createMany({
        data: nearby.map((offer) => ({
          offerId: offer.id,
          propertyId: property.id,
          businessId: offer.business.id,
        })),
      });
    }

    const result = nearby.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      imageUrl: offer.imageUrl,
      redeemUrl: offer.redeemUrl,
      businessName: offer.business.name,
      businessCategory: offer.business.category,
      businessLogoUrl: offer.business.logoUrl,
    }));

    const style = property.widgetStyle as Record<string, string> | null;

    return NextResponse.json({ offers: result, style }, { headers: corsHeaders });
  } catch (err) {
    console.error("Widget GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

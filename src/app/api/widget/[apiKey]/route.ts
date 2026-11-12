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
    const property = await prisma.property.findUnique({ where: { apiKey } });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!property.widgetEnabled) {
      return NextResponse.json([], { headers: corsHeaders });
    }

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
          },
        },
      },
    });

    // Filter by radius and budget
    const nearby = offers.filter((offer) => {
      if (offer.spentCents >= offer.budgetCents) return false;
      const dist = distanceMiles(
        property.lat,
        property.lng,
        offer.business.lat,
        offer.business.lng
      );
      return dist <= offer.radiusMiles;
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

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (err) {
    console.error("Widget GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

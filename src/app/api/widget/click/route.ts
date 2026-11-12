import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { offerId, propertyApiKey } = await req.json();

    const property = await prisma.property.findUnique({
      where: { apiKey: propertyApiKey },
    });
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { business: { select: { id: true } } },
    });
    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Record click and increment spend
    await Promise.all([
      prisma.click.create({
        data: {
          offerId: offer.id,
          propertyId: property.id,
          businessId: offer.business.id,
        },
      }),
      prisma.offer.update({
        where: { id: offer.id },
        data: { spentCents: { increment: offer.cpcCents } },
      }),
    ]);

    return NextResponse.json(
      { success: true, redeemUrl: offer.redeemUrl },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Widget click error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const redemption = await prisma.redemption.findUnique({
      where: { token },
      include: {
        offer: { select: { title: true, description: true, imageUrl: true, expiresAt: true } },
        business: { select: { name: true, logoUrl: true, category: true, address: true, city: true, state: true } },
      },
    });

    if (!redemption) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: redemption.firstName,
      offerTitle: redemption.offer.title,
      offerDescription: redemption.offer.description,
      offerImageUrl: redemption.offer.imageUrl,
      offerExpiresAt: redemption.offer.expiresAt,
      businessName: redemption.business.name,
      businessLogoUrl: redemption.business.logoUrl,
      businessCategory: redemption.business.category,
      businessAddress: `${redemption.business.address}, ${redemption.business.city}, ${redemption.business.state}`,
      redeemed: !!redemption.redeemedAt,
      redeemedAt: redemption.redeemedAt,
    });
  } catch (err) {
    console.error("Redeem GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const redemption = await prisma.redemption.findUnique({
      where: { token },
    });

    if (!redemption) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (redemption.redeemedAt) {
      return NextResponse.json({ error: "Already redeemed", redeemedAt: redemption.redeemedAt }, { status: 409 });
    }

    await prisma.redemption.update({
      where: { token },
      data: { redeemedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Redeem POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

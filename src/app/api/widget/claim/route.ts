import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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
    const { offerId, propertyApiKey, firstName, lastName, email } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400, headers: corsHeaders }
      );
    }

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
      include: { business: { select: { id: true, name: true, logoUrl: true } } },
    });
    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create redemption + record click + increment spend
    const [redemption] = await Promise.all([
      prisma.redemption.create({
        data: {
          offerId: offer.id,
          propertyId: property.id,
          businessId: offer.business.id,
          firstName,
          lastName,
          email,
        },
      }),
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://block-and-mortar.vercel.app";
    const redeemLink = `${appUrl}/redeem/${redemption.token}`;

    await sendEmail({
      to: email,
      subject: `Your perk from ${offer.business.name}: ${offer.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="font-size: 22px; color: #1c1917; margin: 0 0 8px;">Your perk is ready, ${firstName}!</h2>
          <p style="font-size: 14px; color: #57534e; margin: 0 0 24px;">Show this at <strong>${offer.business.name}</strong> to redeem your offer.</p>
          <div style="background: #fff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px;">
            <p style="font-size: 18px; font-weight: 700; color: #1c1917; margin: 0 0 4px;">${offer.title}</p>
            <p style="font-size: 13px; color: #78716c; margin: 0 0 16px;">${offer.description}</p>
            <a href="${redeemLink}" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none;">Open My Perk</a>
          </div>
          <p style="font-size: 11px; color: #a8a29e; margin-top: 24px;">Powered by Block & Mortar</p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, redeemUrl: redeemLink },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Widget claim error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await req.json();

    const business = await prisma.business.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, contactName: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.businessId !== session.id) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Find any property to use as the source (or use a placeholder)
    const property = await prisma.property.findFirst({ select: { id: true } });
    const propertyId = property?.id || session.id;

    const redemption = await prisma.redemption.create({
      data: {
        offerId: offer.id,
        propertyId,
        businessId: business.id,
        firstName: business.contactName?.split(" ")[0] || "Test",
        lastName: business.contactName?.split(" ").slice(1).join(" ") || "User",
        email: business.email,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://block-and-mortar.vercel.app";
    const redeemLink = `${appUrl}/redeem/${redemption.token}`;

    await sendEmail({
      to: business.email,
      subject: `[TEST] Your perk from ${business.name}: ${offer.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="background: #fef3c7; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #92400e; font-weight: 600;">This is a test email — this is what your customers will receive.</div>
          <h2 style="font-size: 22px; color: #1c1917; margin: 0 0 8px;">Your perk is ready!</h2>
          <p style="font-size: 14px; color: #57534e; margin: 0 0 24px;">Show this at <strong>${business.name}</strong> to redeem your offer.</p>
          <div style="background: #fff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px;">
            <p style="font-size: 18px; font-weight: 700; color: #1c1917; margin: 0 0 4px;">${offer.title}</p>
            <p style="font-size: 13px; color: #78716c; margin: 0 0 16px;">${offer.description}</p>
            <a href="${redeemLink}" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none;">Open My Perk</a>
          </div>
          <p style="font-size: 11px; color: #a8a29e; margin-top: 24px;">Powered by Block & Mortar</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, redeemUrl: redeemLink });
  } catch (err) {
    console.error("Test offer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

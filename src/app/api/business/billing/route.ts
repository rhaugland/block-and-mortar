import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

// POST: Create or retrieve Stripe checkout session for adding payment method
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = business.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: business.email,
        name: business.name,
        metadata: { businessId: business.id },
      });
      customerId = customer.id;
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create a setup session for adding a payment method
    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      success_url: `${appUrl}/business/dashboard?billing=success`,
      cancel_url: `${appUrl}/business/dashboard?billing=cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Billing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Get billing status for current business
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true },
    });

    if (!business?.stripeCustomerId) {
      return NextResponse.json({ hasPaymentMethod: false, totalSpentCents: 0 });
    }

    const paymentMethods = await getStripe().paymentMethods.list({
      customer: business.stripeCustomerId,
      type: "card",
    });

    const offers = await prisma.offer.findMany({
      where: { businessId: session.id },
      select: { spentCents: true },
    });

    const totalSpentCents = offers.reduce((sum, o) => sum + o.spentCents, 0);

    return NextResponse.json({
      hasPaymentMethod: paymentMethods.data.length > 0,
      cardLast4: paymentMethods.data[0]?.card?.last4 || null,
      totalSpentCents,
    });
  } catch (err) {
    console.error("Billing GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      success_url: `${appUrl}/business/dashboard/billing?setup=success`,
      cancel_url: `${appUrl}/business/dashboard/billing`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Billing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Billing status, invoice history, and current month estimate
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true, email: true },
    });

    // Payment method info
    let hasPaymentMethod = false;
    let cardLast4: string | null = null;
    let cardBrand: string | null = null;

    if (business?.stripeCustomerId) {
      try {
        const pms = await getStripe().paymentMethods.list({
          customer: business.stripeCustomerId,
          type: "card",
        });
        hasPaymentMethod = pms.data.length > 0;
        cardLast4 = pms.data[0]?.card?.last4 || null;
        cardBrand = pms.data[0]?.card?.brand || null;
      } catch {}
    }

    // Invoice history
    const invoices = await prisma.invoice.findMany({
      where: { businessId: session.id },
      orderBy: { periodEnd: "desc" },
      take: 24,
    });

    // Current month estimate: clicks and boosts since last paid invoice
    const lastPaidInvoice = await prisma.invoice.findFirst({
      where: { businessId: session.id, status: "paid" },
      orderBy: { periodEnd: "desc" },
    });
    const periodStart = lastPaidInvoice?.periodEnd || new Date("2020-01-01");

    const [recentClicks, upcomingBoosts] = await Promise.all([
      prisma.click.findMany({
        where: { businessId: session.id, createdAt: { gt: periodStart } },
        select: { offerId: true },
      }),
      prisma.featuredBoost.findMany({
        where: {
          businessId: session.id,
          status: "active",
          date: { gt: periodStart },
        },
        include: { offer: { select: { title: true } } },
        orderBy: { date: "asc" },
      }),
    ]);

    // Calculate click charges grouped by offer CPC
    const clicksByOffer: Record<string, number> = {};
    for (const c of recentClicks) {
      clicksByOffer[c.offerId] = (clicksByOffer[c.offerId] || 0) + 1;
    }
    const offerIds = Object.keys(clicksByOffer);
    const offerCpcs = offerIds.length > 0
      ? await prisma.offer.findMany({ where: { id: { in: offerIds } }, select: { id: true, cpcCents: true } })
      : [];
    const cpcMap: Record<string, number> = {};
    for (const o of offerCpcs) cpcMap[o.id] = o.cpcCents;
    let currentClickCents = 0;
    for (const [offerId, count] of Object.entries(clicksByOffer)) {
      currentClickCents += count * (cpcMap[offerId] || 50);
    }

    const currentBoostCents = upcomingBoosts.reduce((sum, b) => sum + b.amountCents, 0);
    const currentEstimateCents = 2500 + currentClickCents + currentBoostCents; // $25 platform + clicks + boosts

    return NextResponse.json({
      hasPaymentMethod,
      cardLast4,
      cardBrand,
      invoices,
      currentEstimate: {
        platformFeeCents: 2500,
        clickCents: currentClickCents,
        clickCount: recentClicks.length,
        boostCents: currentBoostCents,
        totalCents: currentEstimateCents,
        periodStart: periodStart.toISOString(),
        upcomingBoosts: upcomingBoosts.map((b) => ({
          id: b.id,
          date: b.date.toISOString(),
          offerTitle: b.offer.title,
          amountCents: b.amountCents,
        })),
      },
    });
  } catch (err) {
    console.error("Billing GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

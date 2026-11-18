import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

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

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boostId } = await req.json();
  if (!boostId) {
    return NextResponse.json({ error: "boostId is required" }, { status: 400 });
  }

  // Verify the boost belongs to this business
  const boost = await prisma.featuredBoost.findFirst({
    where: { id: boostId, businessId: session.id, status: "active" },
  });
  if (!boost) {
    return NextResponse.json({ error: "Boost not found" }, { status: 404 });
  }

  // Check if this boost has already been included in a paid invoice
  const billedInvoice = await prisma.invoice.findFirst({
    where: {
      businessId: session.id,
      status: "paid",
      periodStart: { lt: boost.date },
      periodEnd: { gte: boost.date },
      stripeInvoiceId: { not: null },
    },
  });

  // Cancel the boost in DB
  await prisma.featuredBoost.update({
    where: { id: boostId },
    data: { status: "cancelled" },
  });

  // If already billed, issue a partial Stripe refund
  if (billedInvoice?.stripeInvoiceId) {
    try {
      const stripe = getStripe();
      const invoice = await stripe.invoices.retrieve(billedInvoice.stripeInvoiceId) as unknown as { payment_intent?: string | { id: string } };
      const paymentIntentId = typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id;

      if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId) as unknown as { latest_charge?: string | { id: string } };
        const chargeId = typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : pi.latest_charge?.id;

        if (chargeId) {
          await stripe.refunds.create({
            charge: chargeId,
            amount: boost.amountCents,
            reason: "requested_by_customer",
            metadata: { boostId, businessId: session.id },
          });
          return NextResponse.json({ success: true, refunded: true, amountCents: boost.amountCents });
        }
      }
    } catch (err) {
      // Boost is cancelled in DB; log but don't block
      console.error("[boost cancel] Stripe refund failed:", err);
      return NextResponse.json({ success: true, refunded: false, error: "Cancelled but refund failed — contact support" });
    }
  }

  return NextResponse.json({ success: true, refunded: false });
}

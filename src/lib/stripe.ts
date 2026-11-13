import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-10-28.endive",
    });
  }
  return _stripe;
}

interface CreateInvoiceParams {
  customerId: string;
  businessName: string;
  amountCents: number;
  clickCount: number;
  periodStart: Date;
  periodEnd: Date;
}

interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  hostedUrl?: string;
  error?: string;
}

export async function createAndChargeInvoice({
  customerId,
  businessName,
  amountCents,
  clickCount,
  periodStart,
  periodEnd,
}: CreateInvoiceParams): Promise<InvoiceResult> {
  const stripe = getStripe();

  try {
    const periodLabel = `${periodStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

    // Create invoice with a line item
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "charge_automatically",
      auto_advance: true,
      metadata: { businessName, clickCount: String(clickCount) },
    });

    // Add line item for click charges
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: amountCents,
      currency: "usd",
      description: `Block & Mortar — ${clickCount} claims × $${(amountCents / clickCount / 100).toFixed(2)} avg CPC (${periodLabel})`,
    });

    // Finalize and attempt payment
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    const paid = await stripe.invoices.pay(finalized.id);

    return {
      success: paid.status === "paid",
      invoiceId: paid.id,
      hostedUrl: paid.hosted_invoice_url || undefined,
      error: paid.status !== "paid" ? `Invoice status: ${paid.status}` : undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown Stripe error",
    };
  }
}

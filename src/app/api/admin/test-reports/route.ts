import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { buildAdminReport, buildPropertyReport, buildBusinessReport } from "@/lib/report-emails";

export async function POST(req: NextRequest) {
  // Allow admin session OR cron secret for CLI testing
  const session = getSession(req);
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const hasCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;
  if (!hasCronAuth && (!session || session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://blockandmortar.co";
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Sample Admin Report
  const admin = buildAdminReport({
    month,
    totalBusinesses: 24,
    totalProperties: 18,
    newBusinesses: 6,
    newProperties: 4,
    totalClaims: 1842,
    totalRedemptions: 312,
    revenueCents: 92100,
    payoutsCents: 23025,
    profitCents: 69075,
    topBusinesses: [
      { name: "Corner Bistro", spentCents: 18500 },
      { name: "FitBlock Gym", spentCents: 14200 },
      { name: "Maple Street Coffee", spentCents: 11800 },
      { name: "The Dog Spa", spentCents: 9400 },
      { name: "Urban Cuts Barbershop", spentCents: 7600 },
    ],
    expiringOffers: [
      { title: "20% off your first meal", businessName: "Corner Bistro", daysLeft: 3 },
      { title: "Free week trial", businessName: "FitBlock Gym", daysLeft: 5 },
    ],
    appUrl,
  });

  // Sample Property Report
  const property = buildPropertyReport({
    month,
    propertyName: "The Lofts at Maple Grove",
    totalClaims: 284,
    totalRedemptions: 47,
    revenueCents: 3550,
    lastPayoutCents: 2800,
    widgetStatus: "active",
    topOffers: [
      { title: "20% off your first meal", businessName: "Corner Bistro", claims: 86 },
      { title: "Free week trial", businessName: "FitBlock Gym", claims: 62 },
      { title: "Buy 1 Get 1 Free", businessName: "Maple Street Coffee", claims: 48 },
      { title: "Half off first grooming", businessName: "The Dog Spa", claims: 31 },
    ],
    appUrl,
  });

  // Sample Business Report
  const business = buildBusinessReport({
    month,
    businessName: "Corner Bistro",
    totalImpressions: 4280,
    totalClaims: 342,
    totalRedemptions: 58,
    spentCents: 17100,
    budgetCents: 50000,
    offers: [
      { title: "20% off your first meal", claims: 186, redemptions: 32, active: true, spentCents: 9300 },
      { title: "Free appetizer with entree", claims: 124, redemptions: 19, active: true, spentCents: 6200 },
      { title: "Date night BOGO", claims: 32, redemptions: 7, active: false, spentCents: 1600 },
    ],
    appUrl,
  });

  await Promise.all([
    sendEmail({ to: email, subject: `[SAMPLE] ${admin.subject}`, html: admin.html }),
    sendEmail({ to: email, subject: `[SAMPLE] ${property.subject}`, html: property.html }),
    sendEmail({ to: email, subject: `[SAMPLE] ${business.subject}`, html: business.html }),
  ]);

  return NextResponse.json({ sent: true, to: email });
}

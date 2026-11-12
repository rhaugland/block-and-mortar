import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // For now, protect with a simple admin token header
  // TODO: replace with proper admin auth
  const adminToken = req.headers.get("x-admin-token");
  const envToken = process.env.ADMIN_TOKEN;

  // Also allow JWT-based auth with role check
  const cookie = req.cookies.get("bm_token")?.value;
  let isAdmin = false;

  if (adminToken && envToken && adminToken === envToken) {
    isAdmin = true;
  } else if (cookie) {
    const payload = verifyToken(cookie);
    if (payload && payload.role === "admin") {
      isAdmin = true;
    }
  }

  // In development, allow access without auth
  if (!isAdmin && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      totalProperties,
      totalBusinesses,
      totalOffers,
      totalImpressions,
      totalClicks,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.business.count(),
      prisma.offer.count({ where: { active: true } }),
      prisma.impression.count(),
      prisma.click.count(),
    ]);

    // Calculate platform revenue: sum of all clicks * their offer's cpcCents * (1 - revSharePct)
    // Simplified: total clicks * average CPC * platform cut
    const clicks = await prisma.click.findMany({
      select: {
        offer: { select: { cpcCents: true } },
        property: { select: { revSharePct: true } },
      },
    });

    const totalRevenueCents = clicks.reduce((sum, click) => {
      const platformCut = 1 - click.property.revSharePct;
      return sum + Math.round(click.offer.cpcCents * platformCut);
    }, 0);

    return NextResponse.json({
      totalProperties,
      totalBusinesses,
      totalOffers,
      totalImpressions,
      totalClicks,
      totalRevenueCents,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

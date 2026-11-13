import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redemptions = await prisma.redemption.findMany({
      where: { propertyId: session.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        redeemedAt: true,
        createdAt: true,
        offer: { select: { title: true } },
        business: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(redemptions);
  } catch (err) {
    console.error("Property leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redemptions = await prisma.redemption.findMany({
      where: { businessId: session.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        redeemedAt: true,
        createdAt: true,
        offer: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(redemptions);
  } catch (err) {
    console.error("Business leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

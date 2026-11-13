import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.id },
      select: { budgetCents: true, name: true, category: true, logoUrl: true, address: true, city: true, state: true, lat: true, lng: true },
    });

    const spentData = await prisma.offer.aggregate({
      where: { businessId: session.id },
      _sum: { spentCents: true },
    });

    const budgetCents = business?.budgetCents ?? 0;
    const spentCents = spentData._sum.spentCents ?? 0;

    return NextResponse.json({
      budgetCents,
      spentCents,
      name: business?.name ?? "",
      category: business?.category ?? "",
      logoUrl: business?.logoUrl ?? null,
      address: business ? `${business.address}, ${business.city}, ${business.state}` : "",
      lat: business?.lat ?? 0,
      lng: business?.lng ?? 0,
    });
  } catch (err) {
    console.error("Get budget error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { budgetCents } = await req.json();

    if (typeof budgetCents !== "number" || budgetCents < 0) {
      return NextResponse.json({ error: "Invalid budget" }, { status: 400 });
    }

    await prisma.business.update({
      where: { id: session.id },
      data: { budgetCents },
    });

    return NextResponse.json({ budgetCents });
  } catch (err) {
    console.error("Update budget error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

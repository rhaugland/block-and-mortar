import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offers = await prisma.offer.findMany({
      where: { businessId: session.id },
      include: {
        _count: { select: { impressions: true, clicks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = offers.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      imageUrl: o.imageUrl,
      redeemUrl: o.redeemUrl,
      radiusMiles: o.radiusMiles,
      budgetCents: o.budgetCents,
      spentCents: o.spentCents,
      cpcCents: o.cpcCents,
      active: o.active,
      startsAt: o.startsAt,
      expiresAt: o.expiresAt,
      impressions: o._count.impressions,
      clicks: o._count.clicks,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Get offers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, imageUrl, radiusMiles, budgetCents, durationDays } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const expiresAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const offer = await prisma.offer.create({
      data: {
        businessId: session.id,
        title,
        description: description || title,
        imageUrl: imageUrl || null,
        redeemUrl: null,
        radiusMiles: radiusMiles ?? 3.0,
        budgetCents: budgetCents ?? 2500,
        cpcCents: 50,
        expiresAt,
      },
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (err) {
    console.error("Create offer error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

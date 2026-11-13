import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await params;
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.businessId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.radiusMiles === "number") data.radiusMiles = body.radiusMiles;
    if (typeof body.imageUrl === "string" || body.imageUrl === null) data.imageUrl = body.imageUrl;

    const updated = await prisma.offer.update({
      where: { id: offerId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update offer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ offerId: string }> }
) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await params;
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer || offer.businessId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.offer.delete({ where: { id: offerId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete offer error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

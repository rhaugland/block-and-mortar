import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await prisma.location.findMany({
      where: { propertyId: session.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ locations });
  } catch (err) {
    console.error("Locations GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, address, city, state, zip } = await req.json();

    if (!name || !address || !city || !state || !zip) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const geo = await geocodeAddress(address, city, state, zip);

    const location = await prisma.location.create({
      data: {
        propertyId: session.id,
        name,
        address,
        city,
        state,
        zip,
        lat: geo.lat,
        lng: geo.lng,
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (err) {
    console.error("Location create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    // Verify ownership
    const location = await prisma.location.findFirst({
      where: { id, propertyId: session.id },
    });
    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // Don't allow deleting the last location
    const count = await prisma.location.count({ where: { propertyId: session.id } });
    if (count <= 1) {
      return NextResponse.json({ error: "You must have at least one location" }, { status: 400 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Location delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

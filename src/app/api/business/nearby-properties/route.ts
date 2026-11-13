import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { distanceMiles } from "@/lib/geo";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "business") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const radiusParam = req.nextUrl.searchParams.get("radius");
    const radius = parseFloat(radiusParam || "3") || 3;

    const business = await prisma.business.findUnique({
      where: { id: session.id },
      select: { lat: true, lng: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const properties = await prisma.property.findMany({
      where: { widgetEnabled: true },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        lat: true,
        lng: true,
        locations: { select: { name: true, lat: true, lng: true } },
      },
    });

    const nearby = properties
      .map((p) => {
        // Check main property coords + all location coords
        const allCoords = [
          { lat: p.lat, lng: p.lng },
          ...p.locations.map((l) => ({ lat: l.lat, lng: l.lng })),
        ];
        const closest = Math.min(
          ...allCoords.map((c) => distanceMiles(business.lat, business.lng, c.lat, c.lng))
        );
        return { id: p.id, name: p.name, city: p.city, state: p.state, distance: Math.round(closest * 10) / 10 };
      })
      .filter((p) => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearby);
  } catch (err) {
    console.error("Nearby properties error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

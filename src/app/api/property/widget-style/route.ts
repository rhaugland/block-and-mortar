import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { primaryColor, accentColor, fontFamily, borderRadius } = await req.json();

    const property = await prisma.property.update({
      where: { id: session.id },
      data: {
        widgetStyle: { primaryColor, accentColor, fontFamily, borderRadius },
      },
      select: { widgetStyle: true },
    });

    return NextResponse.json({ widgetStyle: property.widgetStyle });
  } catch (err) {
    console.error("Widget style save error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

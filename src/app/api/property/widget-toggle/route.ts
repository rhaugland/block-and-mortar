import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await req.json();
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
    }

    const property = await prisma.property.update({
      where: { id: session.id },
      data: { widgetEnabled: enabled },
      select: { widgetEnabled: true },
    });

    return NextResponse.json({ widgetEnabled: property.widgetEnabled });
  } catch (err) {
    console.error("Widget toggle error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

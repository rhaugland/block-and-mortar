import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "property") {
    const p = await prisma.property.findUnique({
      where: { id: session.id },
      select: { email: true, contactName: true },
    });
    return NextResponse.json({
      email: p?.email || "",
      name: p?.contactName || "",
    });
  }

  if (session.role === "business") {
    const b = await prisma.business.findUnique({
      where: { id: session.id },
      select: { email: true, contactName: true },
    });
    return NextResponse.json({
      email: b?.email || "",
      name: b?.contactName || "",
    });
  }

  // Admin
  return NextResponse.json({
    email: process.env.ADMIN_EMAIL || "",
    name: "Admin",
  });
}

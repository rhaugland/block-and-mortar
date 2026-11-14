import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "property") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const property = await prisma.property.findUnique({
    where: { id: session.id },
    select: { monthlyReport: true },
  });
  return NextResponse.json({ enabled: property?.monthlyReport ?? false });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "property") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { enabled } = await req.json();
  await prisma.property.update({
    where: { id: session.id },
    data: { monthlyReport: !!enabled },
  });
  return NextResponse.json({ enabled: !!enabled });
}

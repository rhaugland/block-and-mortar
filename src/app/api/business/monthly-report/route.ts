import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business = await prisma.business.findUnique({
    where: { id: session.id },
    select: { monthlyReport: true },
  });
  return NextResponse.json({ enabled: business?.monthlyReport ?? false });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { enabled } = await req.json();
  await prisma.business.update({
    where: { id: session.id },
    data: { monthlyReport: !!enabled },
  });
  return NextResponse.json({ enabled: !!enabled });
}

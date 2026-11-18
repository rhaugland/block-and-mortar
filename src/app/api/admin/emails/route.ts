import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sent, received] = await Promise.all([
    prisma.outboundEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.inboundEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const unreadCount = received.filter((r) => !r.read).length;

  return NextResponse.json({ sent, received, unreadCount });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticketId, reopen } = await req.json();

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: reopen ? "open" : "closed" },
  });

  return NextResponse.json({ success: true });
}

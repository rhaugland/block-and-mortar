import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    orderBy: [{ lastContactedAt: "asc" }, { createdAt: "asc" }],
    include: { contactList: { select: { name: true } } },
  });

  const lists = await prisma.contactList.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, count: true, createdAt: true },
  });

  return NextResponse.json({ contacts, lists });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contactId } = await req.json();
  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 });

  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}

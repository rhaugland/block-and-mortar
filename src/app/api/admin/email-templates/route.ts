import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type, subject, bodyHtml } = await req.json();
  if (!name || !type || !subject || !bodyHtml) {
    return NextResponse.json({ error: "name, type, subject, and bodyHtml are required" }, { status: 400 });
  }

  const template = await prisma.emailTemplate.create({
    data: { name, type, subject, bodyHtml },
  });

  return NextResponse.json({ template });
}

export async function PUT(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, type, subject, bodyHtml } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const template = await prisma.emailTemplate.update({
    where: { id },
    data: { name, type, subject, bodyHtml },
  });

  return NextResponse.json({ template });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.emailTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

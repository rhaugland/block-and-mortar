import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sentId, receivedId, threadEmail } = await req.json();

  // Delete entire thread by email address
  if (threadEmail) {
    const email = threadEmail.toLowerCase();
    const [deletedSent, deletedReceived] = await Promise.all([
      prisma.outboundEmail.deleteMany({ where: { toEmail: email } }),
      prisma.inboundEmail.deleteMany({ where: { fromEmail: email } }),
    ]);
    return NextResponse.json({
      success: true,
      deleted: deletedSent.count + deletedReceived.count,
    });
  }

  // Delete individual sent email
  if (sentId) {
    await prisma.outboundEmail.delete({ where: { id: sentId } });
    return NextResponse.json({ success: true });
  }

  // Delete individual received email
  if (receivedId) {
    await prisma.inboundEmail.delete({ where: { id: receivedId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide sentId, receivedId, or threadEmail" }, { status: 400 });
}

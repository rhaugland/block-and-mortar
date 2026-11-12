import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.used || reset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired or is invalid." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    if (reset.role === "property") {
      await prisma.property.update({
        where: { email: reset.email },
        data: { password: hashed },
      });
    } else {
      await prisma.business.update({
        where: { email: reset.email },
        data: { password: hashed },
      });
    }

    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

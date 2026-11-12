import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email || !role || !["property", "business"].includes(role)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check if user exists (don't reveal whether they do)
    const user =
      role === "property"
        ? await prisma.property.findUnique({ where: { email }, select: { id: true } })
        : await prisma.business.findUnique({ where: { email }, select: { id: true } });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordReset.create({
        data: { email, role, token, expiresAt },
      });

      const origin = req.headers.get("origin") || req.nextUrl.origin;
      const resetUrl = `${origin}/reset-password?token=${token}`;

      await sendEmail({
        to: email,
        subject: "Reset your Block & Mortar password",
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="font-size: 22px; color: #1c1917;">Reset your password</h2>
            <p style="color: #57534e; font-size: 15px; line-height: 1.6;">
              Click the button below to reset your password. This link expires in 1 hour.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 16px;">
              Reset Password
            </a>
            <p style="color: #a8a29e; font-size: 12px; margin-top: 24px;">
              If you didn&apos;t request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

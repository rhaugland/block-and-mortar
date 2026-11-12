import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      address,
      city,
      state,
      zip,
      lat,
      lng,
      category,
      email,
      password,
      contactName,
      phone,
      websiteUrl,
    } = body;

    if (!name || !address || !city || !state || !zip || !category || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const hashed = await bcrypt.hash(password, 10);

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        address,
        city,
        state,
        zip,
        lat: lat || 0,
        lng: lng || 0,
        category,
        email,
        password: hashed,
        contactName: contactName || null,
        phone: phone || null,
        websiteUrl: websiteUrl || null,
      },
    });

    const token = signToken({ id: business.id, role: "business" });

    const { password: _, ...safe } = business;

    const res = NextResponse.json(safe, { status: 201 });
    res.cookies.set("bm_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email or business name already registered" },
        { status: 409 }
      );
    }
    console.error("Business signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, city, state, zip, lat, lng, email, password, contactName, websiteUrl } = body;

    if (!name || !address || !city || !state || !zip || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const hashed = await bcrypt.hash(password, 10);
    const geo = await geocodeAddress(address, city, state, zip);

    const property = await prisma.property.create({
      data: {
        name,
        slug,
        address,
        city,
        state,
        zip,
        lat: geo.lat,
        lng: geo.lng,
        email,
        password: hashed,
        contactName: contactName || null,
        websiteUrl: websiteUrl || null,
      },
    });

    const token = signToken({ id: property.id, role: "property" });
    const { password: _, ...safe } = property;

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
      return NextResponse.json({ error: "Email or property name already registered" }, { status: 409 });
    }
    console.error("Property signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

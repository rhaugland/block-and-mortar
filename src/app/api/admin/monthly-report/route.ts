import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Admin report preference stored in a simple env var or localStorage-based approach
// We'll use a lightweight KV approach via a JSON file, but for now just toggle via env
// The cron reads ADMIN_REPORT_EMAIL to know where to send
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Admin report is enabled if ADMIN_REPORT_EMAIL is set
  return NextResponse.json({ enabled: !!process.env.ADMIN_REPORT_EMAIL });
}

// For admin, toggling is a no-op on the server — they just need the env var set.
// We return the current state.
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: !!process.env.ADMIN_REPORT_EMAIL });
}

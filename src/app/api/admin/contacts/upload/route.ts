import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const type = (formData.get("type") as string) || "business";

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  if (rows.length === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  // Normalize column names (case-insensitive, handle spaces)
  const normalize = (key: string) => key.toLowerCase().replace(/[\s_-]/g, "");
  const colMap = (row: Record<string, string>) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      out[normalize(k)] = String(v || "").trim();
    }
    return out;
  };

  // Create the contact list record
  const listRecord = await prisma.contactList.create({
    data: { name: file.name, count: 0 },
  });

  let imported = 0;
  let skipped = 0;

  for (const rawRow of rows) {
    const row = colMap(rawRow);
    const email = row["email"] || row["emailaddress"] || row["e-mail"] || "";
    if (!email || !email.includes("@")) { skipped++; continue; }

    const firstName = row["firstname"] || row["first"] || row["fname"] || null;
    const lastName = row["lastname"] || row["last"] || row["lname"] || null;
    const company = row["companyname"] || row["company"] || row["organization"] || row["businessname"] || null;

    try {
      await prisma.contact.upsert({
        where: { email: email.toLowerCase() },
        update: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          company: company || undefined,
          contactListId: listRecord.id,
          type,
        },
        create: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          company,
          contactListId: listRecord.id,
          type,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  await prisma.contactList.update({
    where: { id: listRecord.id },
    data: { count: imported },
  });

  return NextResponse.json({ success: true, imported, skipped, listId: listRecord.id });
}

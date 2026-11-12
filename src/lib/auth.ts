import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface TokenPayload {
  id: string;
  role: "business" | "property" | "admin";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get("bm_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

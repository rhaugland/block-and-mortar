import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

interface DesignTokens {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session || session.role !== "property") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch the website
    const res = await fetch(url, {
      headers: { "User-Agent": "BlockAndMortar-StyleAnalyzer/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not fetch that website" }, { status: 400 });
    }

    const html = await res.text();

    // Also try to fetch main CSS files
    let cssText = "";
    const cssLinks = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi)];
    const base = new URL(url);
    for (const match of cssLinks.slice(0, 5)) {
      try {
        const cssUrl = new URL(match[1], base).href;
        const cssRes = await fetch(cssUrl, {
          headers: { "User-Agent": "BlockAndMortar-StyleAnalyzer/1.0" },
          signal: AbortSignal.timeout(5000),
        });
        if (cssRes.ok) cssText += await cssRes.text();
      } catch { /* skip */ }
    }

    // Extract inline styles too
    const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
      .map((m) => m[1])
      .join("\n");
    cssText += "\n" + inlineStyles;

    const tokens = analyzeDesign(html, cssText, base.href);

    return NextResponse.json({ tokens });
  } catch (err) {
    console.error("Analyze site error:", err);
    return NextResponse.json({ error: "Failed to analyze site" }, { status: 500 });
  }
}

function analyzeDesign(html: string, css: string, _url: string): DesignTokens {
  const combined = html + "\n" + css;

  // --- COLORS ---
  // 1. Check meta theme-color
  const themeColor = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1];

  // 2. Extract CSS custom properties that look like brand colors
  const cssVarColors: string[] = [];
  const varPatterns = [
    /--(?:primary|brand|main|accent|theme)[^:]*:\s*([^;]+)/gi,
    /--(?:color-primary|color-brand|color-accent|color-main)[^:]*:\s*([^;]+)/gi,
  ];
  for (const pattern of varPatterns) {
    for (const match of combined.matchAll(pattern)) {
      const val = match[1].trim();
      if (isColor(val)) cssVarColors.push(val);
    }
  }

  // 3. Extract hex colors from CSS (excluding common greys/black/white)
  const hexColors: Record<string, number> = {};
  for (const match of combined.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
    const hex = normalizeHex(match[0]);
    if (hex && !isNeutral(hex)) {
      hexColors[hex] = (hexColors[hex] || 0) + 1;
    }
  }

  // 4. Extract rgb/hsl colors
  for (const match of combined.matchAll(/(?:rgb|hsl)a?\([^)]+\)/gi)) {
    const hex = cssColorToHex(match[0]);
    if (hex && !isNeutral(hex)) {
      hexColors[hex] = (hexColors[hex] || 0) + 1;
    }
  }

  // Pick primary: theme-color > css vars > most frequent
  const sortedColors = Object.entries(hexColors).sort((a, b) => b[1] - a[1]);
  const primaryColor = themeColor || cssVarColors[0] || sortedColors[0]?.[0] || "#ff6b5b";
  const accentColor = cssVarColors[1] || sortedColors[1]?.[0] || sortedColors[0]?.[0] || "#fb923c";

  // --- FONTS ---
  const fontMatches: Record<string, number> = {};
  for (const match of combined.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const family = match[1].trim().split(",")[0].replace(/['"]/g, "").trim();
    if (family && !family.startsWith("var(") && family.length < 50) {
      fontMatches[family] = (fontMatches[family] || 0) + 1;
    }
  }
  // Also check Google Fonts links
  const googleFont = html.match(/fonts\.googleapis\.com\/css2?\?family=([^&"']+)/i)?.[1]?.replace(/\+/g, " ").split(":")[0];

  const sortedFonts = Object.entries(fontMatches).sort((a, b) => b[1] - a[1]);
  const fontFamily = googleFont || sortedFonts[0]?.[0] || "system-ui";

  // --- BORDER RADIUS ---
  const radiusCounts: Record<string, number> = {};
  for (const match of combined.matchAll(/border-radius\s*:\s*([^;}]+)/gi)) {
    const val = match[1].trim().split(" ")[0];
    if (val && !val.startsWith("var(")) {
      radiusCounts[val] = (radiusCounts[val] || 0) + 1;
    }
  }
  const sortedRadii = Object.entries(radiusCounts).sort((a, b) => b[1] - a[1]);
  const borderRadius = sortedRadii[0]?.[0] || "12px";

  return { primaryColor, accentColor, fontFamily, borderRadius };
}

function normalizeHex(hex: string): string | null {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 8) h = h.slice(0, 6); // strip alpha
  if (h.length !== 6) return null;
  return "#" + h;
}

function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  // Filter out very dark, very light, or very desaturated colors
  if (max < 30) return true; // near black
  if (min > 225) return true; // near white
  if (saturation < 0.1 && max > 60) return true; // grey
  return false;
}

function isColor(val: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(val) || /^(?:rgb|hsl)a?\(/i.test(val);
}

function cssColorToHex(color: string): string | null {
  const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const r = parseInt(rgb[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgb[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgb[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return null;
}

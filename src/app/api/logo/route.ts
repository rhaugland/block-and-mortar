// Serves the Block & Mortar logo as an SVG image for email signatures
export async function GET() {
  const svg = `<svg width="140" height="28" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Ground -->
  <rect x="0" y="25" width="30" height="3" rx="1.5" fill="#fbbf24" opacity="0.4"/>
  <!-- Left building -->
  <rect x="1" y="10" width="8" height="15" rx="2" fill="#ff6b5b"/>
  <rect x="3" y="13" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="3" y="17.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <!-- Middle building -->
  <rect x="11" y="3" width="8" height="22" rx="2" fill="#fb923c"/>
  <rect x="13" y="6" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="17" y="6" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="13" y="11" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="17" y="11" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="14" y="19" width="2.5" height="6" rx="0.5" fill="#fbbf24" opacity="0.7"/>
  <!-- Right building -->
  <rect x="21" y="13" width="8" height="12" rx="2" fill="#ff6b5b" opacity="0.75"/>
  <rect x="23" y="15.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="26" y="15.5" width="2" height="2.5" rx="0.5" fill="white" opacity="0.6"/>
  <rect x="24" y="20" width="3" height="5" rx="0.5" fill="#fbbf24" opacity="0.6"/>
  <!-- Text: Block -->
  <text x="36" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="600" fill="#ff6b5b">Block</text>
  <!-- Text: & -->
  <text x="72" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="400" fill="#a8a29e">&amp;</text>
  <!-- Text: Mortar -->
  <text x="83" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="600" fill="#1c1917">Mortar</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

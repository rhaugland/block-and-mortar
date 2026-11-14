// Branded monthly report email templates for Block & Mortar

const HEADER = `
<div style="background: linear-gradient(135deg, #ff6b5b 0%, #fb923c 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    Block &amp; Mortar
  </h1>
  <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.85); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    Monthly Report
  </p>
</div>`;

const FOOTER = `
<div style="padding: 24px; text-align: center; border-top: 1px solid #f0ebe4;">
  <p style="margin: 0; font-size: 12px; color: #a8a29e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    You&rsquo;re receiving this because you opted in to monthly reports.<br/>
    <a href="{{dashboardUrl}}" style="color: #ff6b5b; text-decoration: none;">Manage preferences</a> &middot;
    <a href="mailto:support@blockandmortar.co" style="color: #ff6b5b; text-decoration: none;">Contact support</a>
  </p>
  <p style="margin: 12px 0 0; font-size: 11px; color: #d6d3d1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    &copy; ${new Date().getFullYear()} Block &amp; Mortar
  </p>
</div>`;

function wrap(body: string, dashboardUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
<div style="max-width: 560px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
  ${HEADER}
  ${body}
  ${FOOTER.replace("{{dashboardUrl}}", dashboardUrl)}
</div>
</body>
</html>`;
}

function statCard(label: string, value: string, color: string = "#1c1917"): string {
  return `
  <div style="flex: 1; text-align: center; padding: 16px 8px;">
    <p style="margin: 0; font-size: 11px; font-weight: 600; color: #a8a29e; text-transform: uppercase; letter-spacing: 0.5px;">${label}</p>
    <p style="margin: 6px 0 0; font-size: 28px; font-weight: 700; color: ${color};">${value}</p>
  </div>`;
}

function sectionTitle(title: string): string {
  return `<p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1c1917;">${title}</p>`;
}

// ── Admin Report ──────────────────────────────────────────────

interface AdminReportData {
  month: string;
  totalBusinesses: number;
  totalProperties: number;
  newBusinesses: number;
  newProperties: number;
  totalClaims: number;
  totalRedemptions: number;
  revenueCents: number;
  payoutsCents: number;
  profitCents: number;
  topBusinesses: { name: string; spentCents: number }[];
  expiringOffers: { title: string; businessName: string; daysLeft: number }[];
  appUrl: string;
}

export function buildAdminReport(d: AdminReportData): { subject: string; html: string } {
  const body = `
  <div style="padding: 24px;">
    <p style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1c1917;">Hi there,</p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #57534e; line-height: 1.5;">
      Here&rsquo;s your ${d.month} platform overview.
    </p>

    ${sectionTitle("Platform Growth")}
    <div style="display: flex; background: #fef9f0; border-radius: 12px; margin-bottom: 20px;">
      ${statCard("Businesses", String(d.totalBusinesses), "#1c1917")}
      ${statCard("Properties", String(d.totalProperties), "#1c1917")}
      ${statCard("New This Month", `+${d.newBusinesses + d.newProperties}`, "#ff6b5b")}
    </div>

    ${sectionTitle("Activity")}
    <div style="display: flex; background: #fff7ed; border-radius: 12px; margin-bottom: 20px;">
      ${statCard("Claims", d.totalClaims.toLocaleString())}
      ${statCard("Redeemed", d.totalRedemptions.toLocaleString())}
      ${statCard("Rate", d.totalClaims > 0 ? ((d.totalRedemptions / d.totalClaims) * 100).toFixed(1) + "%" : "0%")}
    </div>

    ${sectionTitle("Revenue")}
    <div style="display: flex; background: #fef2f2; border-radius: 12px; margin-bottom: 20px;">
      ${statCard("Revenue", "$" + (d.revenueCents / 100).toFixed(2))}
      ${statCard("Payouts", "-$" + (d.payoutsCents / 100).toFixed(2))}
      ${statCard("Profit", "$" + (d.profitCents / 100).toFixed(2), "#ff6b5b")}
    </div>

    ${d.topBusinesses.length > 0 ? `
    ${sectionTitle("Top Businesses")}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${d.topBusinesses.slice(0, 5).map((b, i) => `
      <tr style="border-bottom: 1px solid #f5f0eb;">
        <td style="padding: 8px 0; font-size: 13px; color: #57534e;">${i + 1}. ${b.name}</td>
        <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #1c1917; text-align: right;">$${(b.spentCents / 100).toFixed(2)}</td>
      </tr>`).join("")}
    </table>` : ""}

    ${d.expiringOffers.length > 0 ? `
    ${sectionTitle("Expiring Soon")}
    ${d.expiringOffers.slice(0, 5).map(o => `
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px;">
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">&ldquo;${o.title}&rdquo; &mdash; ${o.daysLeft === 0 ? "Expired" : o.daysLeft + "d left"}</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #b45309;">${o.businessName}</p>
    </div>`).join("")}` : ""}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${d.appUrl}/admin/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Dashboard
      </a>
    </div>
  </div>`;

  return {
    subject: `Block & Mortar — ${d.month} Admin Report`,
    html: wrap(body, `${d.appUrl}/admin/dashboard`),
  };
}

// ── Property Report ──────────────────────────────────────────

interface PropertyReportData {
  month: string;
  propertyName: string;
  totalClaims: number;
  totalRedemptions: number;
  revenueCents: number;
  lastPayoutCents: number | null;
  widgetStatus: "active" | "inactive" | "not_installed" | "hidden";
  topOffers: { title: string; businessName: string; claims: number }[];
  appUrl: string;
}

export function buildPropertyReport(d: PropertyReportData): { subject: string; html: string } {
  const statusLabel = {
    active: "Active",
    inactive: "Inactive (no pings in 24h)",
    not_installed: "Not installed",
    hidden: "Hidden (toggled off)",
  }[d.widgetStatus];

  const statusColor = {
    active: "#16a34a",
    inactive: "#d97706",
    not_installed: "#dc2626",
    hidden: "#6b7280",
  }[d.widgetStatus];

  const body = `
  <div style="padding: 24px;">
    <p style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1c1917;">Hi ${d.propertyName},</p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #57534e; line-height: 1.5;">
      Here&rsquo;s how your perks widget performed in ${d.month}.
    </p>

    <div style="display: flex; background: #fef9f0; border-radius: 12px; margin-bottom: 20px;">
      ${statCard("Claims", d.totalClaims.toLocaleString())}
      ${statCard("Redeemed", d.totalRedemptions.toLocaleString())}
      ${statCard("Earnings", "$" + (d.revenueCents / 100).toFixed(2), "#ff6b5b")}
    </div>

    <div style="background: #f8f7f4; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #a8a29e;">WIDGET STATUS</p>
      <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: ${statusColor};">${statusLabel}</p>
    </div>

    ${d.lastPayoutCents !== null ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 12px; font-weight: 600; color: #16a34a;">LAST PAYOUT</p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; color: #15803d;">$${(d.lastPayoutCents / 100).toFixed(2)}</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #22c55e;">Visa gift card sent to your email</p>
    </div>` : ""}

    ${d.topOffers.length > 0 ? `
    ${sectionTitle("Most Popular Perks")}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      ${d.topOffers.slice(0, 5).map((o, i) => `
      <tr style="border-bottom: 1px solid #f5f0eb;">
        <td style="padding: 8px 0; font-size: 13px; color: #1c1917; font-weight: 500;">${i + 1}. ${o.title}</td>
        <td style="padding: 8px 0; font-size: 12px; color: #57534e;">${o.businessName}</td>
        <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #1c1917; text-align: right;">${o.claims} claims</td>
      </tr>`).join("")}
    </table>` : ""}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${d.appUrl}/property/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Dashboard
      </a>
    </div>
  </div>`;

  return {
    subject: `Block & Mortar — ${d.month} Report for ${d.propertyName}`,
    html: wrap(body, `${d.appUrl}/property/dashboard`),
  };
}

// ── Business Report ──────────────────────────────────────────

interface BusinessReportData {
  month: string;
  businessName: string;
  totalImpressions: number;
  totalClaims: number;
  totalRedemptions: number;
  spentCents: number;
  budgetCents: number;
  offers: { title: string; claims: number; redemptions: number; active: boolean; spentCents: number }[];
  appUrl: string;
}

export function buildBusinessReport(d: BusinessReportData): { subject: string; html: string } {
  const budgetPct = d.budgetCents > 0 ? Math.min(100, Math.round((d.spentCents / d.budgetCents) * 100)) : 0;

  const body = `
  <div style="padding: 24px;">
    <p style="margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #1c1917;">Hi ${d.businessName},</p>
    <p style="margin: 0 0 20px; font-size: 14px; color: #57534e; line-height: 1.5;">
      Here&rsquo;s how your offers performed in ${d.month}.
    </p>

    <div style="display: flex; background: #fef9f0; border-radius: 12px; margin-bottom: 20px;">
      ${statCard("Claims", d.totalClaims.toLocaleString())}
      ${statCard("Redeemed", d.totalRedemptions.toLocaleString())}
      ${statCard("Spent", "$" + (d.spentCents / 100).toFixed(2), "#ff6b5b")}
    </div>

    ${d.budgetCents > 0 ? `
    <div style="background: #fef9f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 600; color: #a8a29e;">BUDGET USAGE</span>
        <span style="font-size: 13px; font-weight: 600; color: #1c1917;">${budgetPct}%</span>
      </div>
      <div style="background: #f0ebe4; border-radius: 6px; height: 8px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #ff6b5b, #fb923c); height: 100%; width: ${budgetPct}%; border-radius: 6px;"></div>
      </div>
      <p style="margin: 8px 0 0; font-size: 12px; color: #57534e;">
        $${(d.spentCents / 100).toFixed(2)} of $${(d.budgetCents / 100).toFixed(2)} &middot;
        $${(Math.max(0, d.budgetCents - d.spentCents) / 100).toFixed(2)} remaining
      </p>
    </div>` : ""}

    ${d.offers.length > 0 ? `
    ${sectionTitle("Your Offers")}
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 2px solid #f5f0eb;">
        <th style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #a8a29e; text-align: left; text-transform: uppercase;">Offer</th>
        <th style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #a8a29e; text-align: right; text-transform: uppercase;">Claims</th>
        <th style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #a8a29e; text-align: right; text-transform: uppercase;">Redeemed</th>
        <th style="padding: 8px 0; font-size: 11px; font-weight: 600; color: #a8a29e; text-align: right; text-transform: uppercase;">Status</th>
      </tr>
      ${d.offers.map(o => `
      <tr style="border-bottom: 1px solid #f5f0eb;">
        <td style="padding: 8px 0; font-size: 13px; color: #1c1917; font-weight: 500;">${o.title}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1c1917; text-align: right;">${o.claims}</td>
        <td style="padding: 8px 0; font-size: 13px; color: #1c1917; text-align: right;">${o.redemptions}</td>
        <td style="padding: 8px 0; font-size: 12px; text-align: right; color: ${o.active ? "#16a34a" : "#6b7280"}; font-weight: 500;">${o.active ? "Live" : "Paused"}</td>
      </tr>`).join("")}
    </table>` : ""}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${d.appUrl}/business/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Dashboard
      </a>
    </div>
  </div>`;

  return {
    subject: `Block & Mortar — ${d.month} Report for ${d.businessName}`,
    html: wrap(body, `${d.appUrl}/business/dashboard`),
  };
}

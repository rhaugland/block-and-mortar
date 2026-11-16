import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const THRESHOLDS = [95, 90, 80] as const;

export async function checkBudgetAlert(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      email: true,
      contactName: true,
      budgetCents: true,
      budgetAlertSent: true,
    },
  });

  if (!business || business.budgetCents <= 0) return;

  // Sum spent across all offers
  const agg = await prisma.offer.aggregate({
    where: { businessId },
    _sum: { spentCents: true },
  });
  const totalSpent = agg._sum.spentCents || 0;
  const pct = (totalSpent / business.budgetCents) * 100;

  // Find the highest threshold crossed
  const crossed = THRESHOLDS.find((t) => pct >= t);
  if (!crossed || crossed <= business.budgetAlertSent) return;

  // Update so we don't send again for this threshold
  await prisma.business.update({
    where: { id: businessId },
    data: { budgetAlertSent: crossed },
  });

  const remaining = Math.max(business.budgetCents - totalSpent, 0);
  const name = business.contactName || business.name;

  await sendEmail({
    to: business.email,
    subject: `Budget Alert: ${crossed}% of your budget has been used`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px;">
        <div style="background: linear-gradient(135deg, #ff6b5b, #fb923c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0; color: #fff; font-size: 16px;">Budget Alert</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e7e5e4; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917; line-height: 1.6;">Hi ${name},</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #1c1917; line-height: 1.6;">
            Your ad budget is <strong>${crossed}% used</strong>. Here&rsquo;s where things stand:
          </p>
          <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #78716c;">Total Budget</span>
              <span style="font-size: 14px; font-weight: 600; color: #1c1917;">$${(business.budgetCents / 100).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #78716c;">Spent</span>
              <span style="font-size: 14px; font-weight: 600; color: #1c1917;">$${(totalSpent / 100).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 13px; color: #78716c;">Remaining</span>
              <span style="font-size: 14px; font-weight: 600; color: ${remaining < business.budgetCents * 0.1 ? '#ef4444' : '#1c1917'};">$${(remaining / 100).toFixed(2)}</span>
            </div>
            <div style="margin-top: 12px; height: 8px; background: #e7e5e4; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.min(pct, 100)}%; background: linear-gradient(135deg, #ff6b5b, #fb923c); border-radius: 4px;"></div>
            </div>
          </div>
          <p style="margin: 0 0 16px; font-size: 13px; color: #78716c; line-height: 1.5;">
            ${crossed >= 95
              ? 'Your budget is almost fully used. Your offers will stop showing once the budget runs out. Consider increasing your budget to keep your deals live.'
              : crossed >= 90
              ? 'You&rsquo;re getting close to your limit. Consider reviewing your offers or increasing your budget.'
              : 'Your campaigns are performing well! Keep an eye on your spend as it approaches your limit.'}
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://block-and-mortar.vercel.app'}/business/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ff6b5b, #fb923c); color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none;">View Dashboard</a>
          <p style="margin: 20px 0 0; font-size: 12px; color: #a8a29e;">&mdash; The Block &amp; Mortar Team</p>
        </div>
      </div>
    `,
  });
}

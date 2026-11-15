export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\nReply-To: ${replyTo || "n/a"}\n${html}`);
    return;
  }

  const payload: Record<string, string> = {
    from: process.env.EMAIL_FROM || "Block & Mortar <support@blockandmortar.co>",
    to,
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

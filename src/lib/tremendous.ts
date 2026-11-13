const API_URL = process.env.TREMENDOUS_API_URL || "https://testflight.tremendous.com/api/v2";
const API_KEY = process.env.TREMENDOUS_API_KEY || "";
const FUNDING_SOURCE_ID = process.env.TREMENDOUS_FUNDING_SOURCE_ID || "";
const CAMPAIGN_ID = process.env.TREMENDOUS_CAMPAIGN_ID || "";

interface SendRewardParams {
  email: string;
  name: string;
  amountCents: number;
  memo: string;
}

interface TremendousResult {
  success: boolean;
  orderId?: string;
  rewardLink?: string;
  error?: string;
}

export async function sendVisaReward({ email, name, amountCents, memo }: SendRewardParams): Promise<TremendousResult> {
  if (!API_KEY) {
    return { success: false, error: "TREMENDOUS_API_KEY not configured" };
  }

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: {
          funding_source_id: FUNDING_SOURCE_ID,
        },
        rewards: [
          {
            value: {
              denomination: amountCents / 100,
              currency_code: "USD",
            },
            delivery: {
              method: "EMAIL",
            },
            recipient: {
              name,
              email,
            },
            products: ["VISA_PREPAID"],
            campaign_id: CAMPAIGN_ID || undefined,
            memo,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.errors?.map((e: { message: string }) => e.message).join(", ") || `HTTP ${res.status}`,
      };
    }

    const reward = data.order?.rewards?.[0];
    return {
      success: true,
      orderId: data.order?.id,
      rewardLink: reward?.delivery?.link,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

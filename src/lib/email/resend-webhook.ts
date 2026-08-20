import { getResendClient } from "@/lib/email/resend";

export type ResendWebhookVerification =
  | { ok: true; event: ReturnType<ReturnType<typeof getResendClient>["webhooks"]["verify"]> }
  | {
      ok: false;
      status: 400 | 401;
      reason: "missing-headers" | "invalid-signature" | "missing-secret";
    };

export function getResendWebhookSecret(): string {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing RESEND_WEBHOOK_SECRET");
  }

  return secret;
}

export function verifyResendWebhook(input: {
  payload: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  webhookSecret: string;
}): ResendWebhookVerification {
  if (!input.svixId || !input.svixTimestamp || !input.svixSignature) {
    return { ok: false, status: 400, reason: "missing-headers" };
  }

  try {
    const resend = getResendClient();
    const event = resend.webhooks.verify({
      payload: input.payload,
      headers: {
        id: input.svixId,
        timestamp: input.svixTimestamp,
        signature: input.svixSignature,
      },
      webhookSecret: input.webhookSecret,
    });

    return { ok: true, event };
  } catch {
    return { ok: false, status: 401, reason: "invalid-signature" };
  }
}

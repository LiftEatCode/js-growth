import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDeliveryEventFingerprint,
  mapResendEventType,
  outreachSendIdempotencyKey,
  parseResendEmailWebhookEvent,
} from "./types";
import {
  buildEmailDeliveryTimeline,
  getOutreachDeliveryState,
  mergeProviderDeliveryStatus,
  providerDeliveryStatusRank,
} from "./state";
import {
  buildSuppressionTargets,
  suppressionReasonForBounce,
} from "@/lib/prospecting/suppression/apply";
import {
  shouldReplaceSuppressionReason,
  suppressionReasonForComplaint,
} from "@/lib/prospecting/suppression/persist";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const occurredAt = new Date("2026-08-19T12:00:00.000Z");

assert(
  mapResendEventType("email.delivered") === "DELIVERED",
  "delivered maps correctly",
);
assert(
  mapResendEventType("email.bounced") === "BOUNCED",
  "bounced maps correctly",
);

const parsed = parseResendEmailWebhookEvent({
  type: "email.delivered",
  created_at: occurredAt.toISOString(),
  data: {
    email_id: "email-123",
    created_at: occurredAt.toISOString(),
    from: "hello@example.com",
    to: ["owner@example.com"],
    subject: "Quick note",
  },
});

assert(parsed?.providerMessageId === "email-123", "parses provider message id");
assert(parsed?.eventType === "DELIVERED", "parses delivered event");

assert(
  buildDeliveryEventFingerprint({
    providerEventId: "evt-1",
    providerMessageId: "email-123",
    eventType: "DELIVERED",
    occurredAt,
  }) === "resend:evt-1",
  "uses provider event id for fingerprint when available",
);

assert(
  mergeProviderDeliveryStatus("DELIVERED", "SENT") === "DELIVERED",
  "late sent does not downgrade delivered",
);
assert(
  mergeProviderDeliveryStatus("BOUNCED", "DELIVERED") === "BOUNCED",
  "bounce outranks delivered",
);
assert(
  mergeProviderDeliveryStatus("COMPLAINED", "BOUNCED") === "COMPLAINED",
  "complaint outranks bounce",
);
assert(
  providerDeliveryStatusRank("COMPLAINED") >
    providerDeliveryStatusRank("DELIVERED"),
  "complaint has highest rank",
);

const timeline = buildEmailDeliveryTimeline({
  channel: "EMAIL",
  status: "SENT",
  approvedAt: new Date("2026-08-19T12:54:00.000Z"),
  sentAt: new Date("2026-08-19T12:55:00.000Z"),
  submittedAt: null,
  providerDeliveryStatus: "DELIVERED",
  deliveredAt: new Date("2026-08-19T12:55:30.000Z"),
  deliveryDelayedAt: null,
  failedAt: null,
  bouncedAt: null,
  complainedAt: null,
  providerSuppressedAt: null,
});

assert(timeline.length === 3, "timeline includes approved sent delivered");
assert(timeline[2]?.label === "Delivered", "timeline shows delivered step");

assert(
  getOutreachDeliveryState({
    channel: "CONTACT_FORM",
    status: "SUBMITTED",
    approvedAt: null,
    sentAt: null,
    submittedAt: occurredAt,
    providerDeliveryStatus: null,
    deliveredAt: null,
    deliveryDelayedAt: null,
    failedAt: null,
    bouncedAt: null,
    complainedAt: null,
    providerSuppressedAt: null,
  }) === null,
  "contact form messages have no email delivery state",
);

const bounceTargets = buildSuppressionTargets({
  hostname: "example.com",
  email: "owner@example.com",
  reason: suppressionReasonForBounce(),
  suppressHostname: false,
  suppressEmail: true,
});

assert(bounceTargets.length === 1, "bounce suppresses email only");
assert(bounceTargets[0]?.type === "EMAIL", "bounce is email-level");

const complaintTargets = buildSuppressionTargets({
  hostname: "example.com",
  email: "owner@example.com",
  reason: suppressionReasonForComplaint(),
  suppressHostname: true,
  suppressEmail: true,
});

assert(complaintTargets.length === 2, "complaint suppresses email and hostname");

assert(
  !shouldReplaceSuppressionReason("OPTED_OUT", "BOUNCED"),
  "bounce does not weaken opt-out",
);
assert(
  shouldReplaceSuppressionReason("BOUNCED", "COMPLAINT"),
  "complaint replaces bounce reason",
);

assert(
  outreachSendIdempotencyKey("msg-1") === "prospecting-outreach/msg-1",
  "stable send idempotency key",
);

const here = dirname(fileURLToPath(import.meta.url));
const webhookRoute = readFileSync(
  join(here, "../../../../app/api/resend/webhook/route.ts"),
  "utf8",
);
const resendWebhook = readFileSync(
  join(here, "../../../email/resend-webhook.ts"),
  "utf8",
);
const outreachActions = readFileSync(
  join(here, "../../../../app/reports/prospecting/outreach-actions.ts"),
  "utf8",
);
const prospectPage = readFileSync(
  join(
    here,
    "../../../../app/reports/prospecting/[campaignId]/prospects/[prospectId]/page.tsx",
  ),
  "utf8",
);

assert(webhookRoute.includes("request.text()"), "webhook uses raw body");
assert(
  resendWebhook.includes("webhooks.verify"),
  "webhook uses Resend signature verification",
);
assert(
  !webhookRoute.includes("getInternalSession"),
  "webhook does not require internal session",
);
assert(
  outreachActions.includes("idempotencyKey"),
  "send includes Resend idempotency key",
);
assert(
  prospectPage.includes("EmailDeliveryTimeline"),
  "prospect page shows email delivery timeline",
);
assert(
  !webhookRoute.includes("email.opened") &&
    !webhookRoute.includes("email.clicked"),
  "open/click tracking not implemented",
);

console.log("delivery.verify.ts passed");

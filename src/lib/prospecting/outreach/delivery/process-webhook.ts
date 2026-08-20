import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { applyDeliverySuppression } from "@/lib/prospecting/outreach/delivery/apply-suppression";
import { mergeProviderDeliveryStatus } from "@/lib/prospecting/outreach/delivery/state";
import {
  buildDeliveryEventFingerprint,
  mapEventTypeToProviderStatus,
  parseResendEmailWebhookEvent,
  type ParsedResendEmailWebhookEvent,
} from "@/lib/prospecting/outreach/delivery/types";

export type ProcessDeliveryWebhookResult =
  | { outcome: "duplicate"; providerMessageId: string }
  | { outcome: "unmatched"; providerMessageId: string }
  | { outcome: "ignored"; reason: string }
  | {
      outcome: "processed";
      providerMessageId: string;
      outreachMessageId: string;
      eventType: ParsedResendEmailWebhookEvent["eventType"];
    };

function timestampFieldForEvent(
  eventType: ParsedResendEmailWebhookEvent["eventType"],
):
  | "deliveredAt"
  | "deliveryDelayedAt"
  | "failedAt"
  | "bouncedAt"
  | "complainedAt"
  | "providerSuppressedAt"
  | null {
  switch (eventType) {
    case "DELIVERED":
      return "deliveredAt";
    case "DELIVERY_DELAYED":
      return "deliveryDelayedAt";
    case "FAILED":
      return "failedAt";
    case "BOUNCED":
      return "bouncedAt";
    case "COMPLAINED":
      return "complainedAt";
    case "SUPPRESSED":
      return "providerSuppressedAt";
    default:
      return null;
  }
}

export async function processResendEmailDeliveryWebhook(input: {
  event: Parameters<typeof parseResendEmailWebhookEvent>[0];
  providerEventId: string | null;
  receivedAt?: Date;
}): Promise<ProcessDeliveryWebhookResult> {
  const parsed = parseResendEmailWebhookEvent(input.event);

  if (!parsed) {
    return { outcome: "ignored", reason: "unsupported-event-type" };
  }

  const providerEventId = input.providerEventId ?? parsed.providerEventId;
  const fingerprint = buildDeliveryEventFingerprint({
    providerEventId,
    providerMessageId: parsed.providerMessageId,
    eventType: parsed.eventType,
    occurredAt: parsed.occurredAt,
  });

  const message = await prisma.outreachMessage.findFirst({
    where: {
      providerMessageId: parsed.providerMessageId,
      channel: "EMAIL",
    },
    include: {
      prospect: {
        select: {
          id: true,
          hostname: true,
          outreachStatus: true,
        },
      },
      contact: {
        select: {
          id: true,
          email: true,
          normalizedEmail: true,
          status: true,
        },
      },
    },
  });

  if (!message) {
    console.info("[resend-webhook] unmatched provider message", {
      providerMessageId: parsed.providerMessageId,
      eventType: parsed.eventType,
    });

    return {
      outcome: "unmatched",
      providerMessageId: parsed.providerMessageId,
    };
  }

  const existing = await prisma.outreachDeliveryEvent.findUnique({
    where: { payloadFingerprint: fingerprint },
    select: { id: true },
  });

  if (existing) {
    console.info("[resend-webhook] duplicate delivery event ignored", {
      providerMessageId: parsed.providerMessageId,
      eventType: parsed.eventType,
      outreachMessageId: message.id,
    });

    return {
      outcome: "duplicate",
      providerMessageId: parsed.providerMessageId,
    };
  }

  const receivedAt = input.receivedAt ?? new Date();
  const nextStatus = mapEventTypeToProviderStatus(parsed.eventType);
  const mergedStatus = mergeProviderDeliveryStatus(
    message.providerDeliveryStatus,
    nextStatus,
  );
  const timestampField = timestampFieldForEvent(parsed.eventType);

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.outreachDeliveryEvent.create({
        data: {
          outreachMessageId: message.id,
          provider: "RESEND",
          providerEventId,
          providerMessageId: parsed.providerMessageId,
          eventType: parsed.eventType,
          occurredAt: parsed.occurredAt,
          receivedAt,
          payloadFingerprint: fingerprint,
          safeMetadataJson:
            Object.keys(parsed.safeMetadata).length > 0
              ? (parsed.safeMetadata as Prisma.InputJsonValue)
              : undefined,
        },
      });

      const messageUpdate: Prisma.OutreachMessageUpdateInput = {
        providerDeliveryStatus: mergedStatus,
      };

      if (timestampField === "deliveredAt" && !message.deliveredAt) {
        messageUpdate.deliveredAt = parsed.occurredAt;
      }
      if (timestampField === "deliveryDelayedAt" && !message.deliveryDelayedAt) {
        messageUpdate.deliveryDelayedAt = parsed.occurredAt;
      }
      if (timestampField === "failedAt" && !message.failedAt) {
        messageUpdate.failedAt = parsed.occurredAt;
      }
      if (timestampField === "bouncedAt" && !message.bouncedAt) {
        messageUpdate.bouncedAt = parsed.occurredAt;
      }
      if (timestampField === "complainedAt" && !message.complainedAt) {
        messageUpdate.complainedAt = parsed.occurredAt;
      }
      if (
        timestampField === "providerSuppressedAt" &&
        !message.providerSuppressedAt
      ) {
        messageUpdate.providerSuppressedAt = parsed.occurredAt;
      }

      if (parsed.eventType === "FAILED" && parsed.safeMetadata.failureReason) {
        messageUpdate.error = String(parsed.safeMetadata.failureReason);
      }

      await transaction.outreachMessage.update({
        where: { id: message.id },
        data: messageUpdate,
      });

      if (
        parsed.eventType === "BOUNCED" ||
        parsed.eventType === "COMPLAINED" ||
        parsed.eventType === "SUPPRESSED"
      ) {
        await applyDeliverySuppression({
          transaction,
          eventType: parsed.eventType,
          message,
          prospect: message.prospect,
          contact: message.contact,
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        outcome: "duplicate",
        providerMessageId: parsed.providerMessageId,
      };
    }

    throw error;
  }

  console.info("[resend-webhook] delivery state updated", {
    providerMessageId: parsed.providerMessageId,
    eventType: parsed.eventType,
    outreachMessageId: message.id,
  });

  return {
    outcome: "processed",
    providerMessageId: parsed.providerMessageId,
    outreachMessageId: message.id,
    eventType: parsed.eventType,
  };
}

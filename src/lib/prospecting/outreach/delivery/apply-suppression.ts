import type {
  OutreachMessage,
  Prospect,
  ProspectContact,
  Prisma,
} from "@/generated/prisma/client";

import {
  buildSuppressionTargets,
  suppressionReasonForBounce,
} from "@/lib/prospecting/suppression/apply";
import {
  persistSuppressionTargets,
  suppressionReasonForComplaint,
  suppressionReasonForProviderSuppressed,
} from "@/lib/prospecting/suppression/persist";
import type { OutreachDeliveryEventTypeValue } from "@/lib/prospecting/outreach/delivery/types";

export async function applyDeliverySuppression(input: {
  transaction: Prisma.TransactionClient;
  eventType: OutreachDeliveryEventTypeValue;
  message: Pick<
    OutreachMessage,
    "id" | "toEmail" | "channel" | "contactId"
  >;
  prospect: Pick<Prospect, "id" | "hostname" | "outreachStatus">;
  contact: Pick<
    ProspectContact,
    "id" | "email" | "normalizedEmail" | "status"
  > | null;
}): Promise<void> {
  if (input.message.channel !== "EMAIL") {
    return;
  }

  const email =
    input.contact?.normalizedEmail ??
    input.contact?.email ??
    input.message.toEmail;

  switch (input.eventType) {
    case "BOUNCED": {
      if (input.contact) {
        await input.transaction.prospectContact.update({
          where: { id: input.contact.id },
          data: { status: "SUPPRESSED" },
        });
      }

      await persistSuppressionTargets(
        input.transaction,
        buildSuppressionTargets({
          hostname: null,
          email,
          reason: suppressionReasonForBounce(),
          suppressHostname: false,
          suppressEmail: true,
        }),
      );
      return;
    }

    case "COMPLAINED": {
      if (input.contact) {
        await input.transaction.prospectContact.update({
          where: { id: input.contact.id },
          data: { status: "SUPPRESSED", isPrimary: false },
        });
      }

      await input.transaction.prospectContactForm.updateMany({
        where: {
          prospectId: input.prospect.id,
          status: { in: ["DISCOVERED", "SELECTED"] },
        },
        data: {
          status: "SUPPRESSED",
          isPrimary: false,
        },
      });

      await persistSuppressionTargets(
        input.transaction,
        buildSuppressionTargets({
          hostname: input.prospect.hostname,
          email,
          reason: suppressionReasonForComplaint(),
          suppressHostname: true,
          suppressEmail: Boolean(email),
        }),
      );

      await input.transaction.prospect.update({
        where: { id: input.prospect.id },
        data: { outreachStatus: "SUPPRESSED" },
      });

      await input.transaction.outreachMessage.updateMany({
        where: {
          prospectId: input.prospect.id,
          status: {
            in: ["APPROVED", "NEEDS_REVIEW", "DRAFT", "FAILED"],
          },
        },
        data: {
          status: "SUPPRESSED",
          error: "Suppressed after spam complaint.",
        },
      });
      return;
    }

    case "SUPPRESSED": {
      if (input.contact) {
        await input.transaction.prospectContact.update({
          where: { id: input.contact.id },
          data: { status: "SUPPRESSED" },
        });
      }

      await persistSuppressionTargets(
        input.transaction,
        buildSuppressionTargets({
          hostname: null,
          email,
          reason: suppressionReasonForProviderSuppressed(),
          suppressHostname: false,
          suppressEmail: Boolean(email),
        }),
      );
      return;
    }

    default:
      return;
  }
}

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  createDeterministicBusinessEventId,
  publishBusinessEventSafely,
} from "@/lib/business-events";
import {
  normalizeAcquisitionForPersistence,
  type AcquisitionContextV1,
} from "@/lib/growth/acquisition-capture";
import { prisma } from "@/lib/prisma";

export type CreateContactSubmissionInput = {
  name: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  website?: string | null;
  service: string;
  budget?: string | null;
  message: string;
  attribution?: unknown;
};

/**
 * Persist contact submission. Attribution and JS OS publishing failures must not
 * throw to callers that already delivered email.
 */
export async function createContactSubmission(
  input: CreateContactSubmissionInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const attribution = normalizeAcquisitionForPersistence(input.attribution);
    const row = await prisma.contactSubmission.create({
      data: {
        name: input.name.trim().slice(0, 200),
        email: input.email.trim().slice(0, 320),
        phone: input.phone?.trim() ? input.phone.trim().slice(0, 40) : null,
        businessName: input.businessName?.trim()
          ? input.businessName.trim().slice(0, 200)
          : null,
        website: input.website?.trim()
          ? input.website.trim().slice(0, 500)
          : null,
        service: input.service.trim().slice(0, 120),
        budget: input.budget?.trim() ? input.budget.trim().slice(0, 120) : null,
        message: input.message.trim().slice(0, 10000),
        attributionJson: attribution
          ? (attribution as unknown as Prisma.InputJsonValue)
          : undefined,
        leadOrigin: "CONTACT",
      },
      select: { id: true },
    });

    await publishBusinessEventSafely({
      version: 1,
      eventId: createDeterministicBusinessEventId("quote", row.id),
      eventType: "growth.quote_submitted",
      occurredAt: new Date().toISOString(),
      title: "Quote request submitted",
      metadata: {
        form_name: "contact",
        source: "website",
      },
    });

    return { ok: true, id: row.id };
  } catch (error) {
    console.error("ContactSubmission persist failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "persist_failed",
    };
  }
}

export async function listRecentContactSubmissions(limit = 40): Promise<
  Array<{
    id: string;
    createdAt: Date;
    service: string;
    leadOrigin: string;
    attributionJson: unknown;
  }>
> {
  return prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      createdAt: true,
      service: true,
      leadOrigin: true,
      attributionJson: true,
    },
  });
}

export async function countContactSubmissionsInWindow(input: {
  periodStart: Date;
  periodEnd: Date;
}): Promise<number> {
  return prisma.contactSubmission.count({
    where: {
      createdAt: { gte: input.periodStart, lt: input.periodEnd },
    },
  });
}

export async function listContactAttributionsInWindow(input: {
  periodStart: Date;
  periodEnd: Date;
}): Promise<Array<{ attributionJson: unknown; createdAt: Date }>> {
  return prisma.contactSubmission.findMany({
    where: {
      createdAt: { gte: input.periodStart, lt: input.periodEnd },
    },
    select: { attributionJson: true, createdAt: true },
    take: 5000,
  });
}

export type { AcquisitionContextV1 };

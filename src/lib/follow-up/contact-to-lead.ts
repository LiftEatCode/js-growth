import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ContactLeadDecision =
  | "CREATE_NEW"
  | "LINK_EXISTING"
  | "ALREADY_LINKED";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Contact", lastName: "Lead" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "Lead" };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export async function previewContactSubmissionLead(submissionId: string): Promise<
  | {
      ok: true;
      submission: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        businessName: string | null;
        website: string | null;
        message: string;
        leadId: string | null;
        attributionJson: unknown;
      };
      existingLeads: Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        company: string | null;
        status: string;
      }>;
      decisionHint: "CREATE_NEW" | "POSSIBLE_EXISTING" | "ALREADY_LINKED";
    }
  | { ok: false; error: string }
> {
  const submission = await prisma.contactSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      businessName: true,
      website: true,
      message: true,
      leadId: true,
      attributionJson: true,
    },
  });
  if (!submission) {
    return { ok: false, error: "not_found" };
  }
  if (submission.leadId) {
    return {
      ok: true,
      submission,
      existingLeads: [],
      decisionHint: "ALREADY_LINKED",
    };
  }

  const email = normalizeEmail(submission.email);
  const existingLeads = await prisma.lead.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      company: true,
      status: true,
    },
  });

  return {
    ok: true,
    submission,
    existingLeads,
    decisionHint: existingLeads.length > 0 ? "POSSIBLE_EXISTING" : "CREATE_NEW",
  };
}

/**
 * Explicit operator action: ContactSubmission → Lead (idempotent).
 * Never silently merges. Ambiguous email matches require linkExistingLeadId.
 */
export async function createOrLinkLeadFromContactSubmission(input: {
  submissionId: string;
  decision: "CREATE_NEW" | "LINK_EXISTING";
  linkExistingLeadId?: string | null;
  operatorEmail?: string | null;
}): Promise<
  | {
      ok: true;
      leadId: string;
      decision: ContactLeadDecision;
      deduplicated: boolean;
    }
  | { ok: false; error: string }
> {
  try {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id: input.submissionId },
    });
    if (!submission) {
      return { ok: false, error: "not_found" };
    }

    if (submission.leadId) {
      return {
        ok: true,
        leadId: submission.leadId,
        decision: "ALREADY_LINKED",
        deduplicated: true,
      };
    }

    if (input.decision === "LINK_EXISTING") {
      const leadId = input.linkExistingLeadId?.trim();
      if (!leadId) {
        return { ok: false, error: "link_lead_required" };
      }
      const existing = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { id: true },
      });
      if (!existing) {
        return { ok: false, error: "lead_not_found" };
      }

      await prisma.$transaction(async (tx) => {
        await tx.contactSubmission.update({
          where: { id: submission.id },
          data: { leadId },
        });
        await tx.leadActivity.create({
          data: {
            leadId,
            type: "MANUAL_NOTE",
            description: "Linked ContactSubmission (operator)",
            fromValue: submission.id,
            toValue: leadId,
          },
        });
      });

      return {
        ok: true,
        leadId,
        decision: "LINK_EXISTING",
        deduplicated: false,
      };
    }

    // CREATE_NEW — block if same email already exists (require explicit link)
    const email = normalizeEmail(submission.email);
    const possible = await prisma.lead.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (possible) {
      return { ok: false, error: "possible_existing" };
    }

    const { firstName, lastName } = splitName(submission.name);
    const website = submission.website?.trim() || "https://contact.local";

    const result = await prisma.$transaction(async (tx) => {
      // Re-check link under transaction (idempotent race)
      const fresh = await tx.contactSubmission.findUnique({
        where: { id: submission.id },
        select: { leadId: true },
      });
      if (fresh?.leadId) {
        return { leadId: fresh.leadId, deduplicated: true as const };
      }

      const created = await tx.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone: submission.phone,
          company: submission.businessName,
          website,
          status: "NEW",
          contacted: false,
          notes: `From contact form (${submission.service}): ${submission.message.slice(0, 500)}`,
        },
        select: { id: true },
      });

      await tx.contactSubmission.update({
        where: { id: submission.id },
        data: { leadId: created.id },
      });

      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: "CREATED",
          description: "Created from ContactSubmission (operator)",
          fromValue: submission.id,
          toValue: created.id,
        },
      });

      return { leadId: created.id, deduplicated: false as const };
    });

    return {
      ok: true,
      leadId: result.leadId,
      decision: result.deduplicated ? "ALREADY_LINKED" : "CREATE_NEW",
      deduplicated: result.deduplicated,
    };
  } catch (error) {
    console.error("createOrLinkLeadFromContactSubmission failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "persist_failed",
    };
  }
}

/** Attribution on ContactSubmission must not be rewritten when linking a lead. */
export function contactAttributionPreserved(
  before: unknown,
  after: unknown,
): boolean {
  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
}

export type { Prisma };

"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_CONTACT_DISCOVERY_CONCURRENCY,
  MAX_CONTACT_DISCOVERY_PER_RUN,
  STALE_CONTACT_DISCOVERY_RUN_MS,
} from "@/lib/prospecting/contacts/constants";
import { discoverProspectContacts } from "@/lib/prospecting/contacts/discover";
import { clampContactDiscoveryBatchSize } from "@/lib/prospecting/contacts/limit";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

export interface ContactActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  runId?: string;
}

function revalidateCampaign(campaignId: string, prospectId?: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);

  if (prospectId) {
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );
  }
}

export async function startCampaignContactDiscovery(
  campaignId: string,
): Promise<ContactActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to find contacts.",
    };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });

  if (!campaign) {
    return {
      success: false,
      message: "The campaign could not be found.",
    };
  }

  const run = await prisma.$transaction(async (transaction) => {
    const staleBefore = new Date(Date.now() - STALE_CONTACT_DISCOVERY_RUN_MS);

    await transaction.prospectContactDiscoveryRun.updateMany({
      where: {
        campaignId,
        status: "RUNNING",
        startedAt: { lt: staleBefore },
      },
      data: {
        status: "FAILED",
        errorMessage: "The previous contact discovery run timed out.",
        completedAt: new Date(),
      },
    });

    const active = await transaction.prospectContactDiscoveryRun.findFirst({
      where: { campaignId, status: "RUNNING" },
      select: { id: true },
    });

    if (active) {
      return { concurrent: true as const, id: active.id };
    }

    const created = await transaction.prospectContactDiscoveryRun.create({
      data: {
        campaignId,
        status: "RUNNING",
        requested: 0,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    return { concurrent: false as const, id: created.id };
  });

  if (run.concurrent) {
    return {
      success: false,
      message: "Contact discovery is already running for this campaign.",
      runId: run.id,
    };
  }

  const startedAt = Date.now();

  try {
    const memberships = await prisma.campaignProspect.findMany({
      where: {
        campaignId,
        isSelectedTopN: true,
        prospect: {
          qualificationStatus: "QUALIFIED",
        },
      },
      include: {
        prospect: {
          include: {
            contacts: true,
          },
        },
      },
      orderBy: { qualificationRank: { sort: "asc", nulls: "last" } },
    });

    const pending = memberships.filter((row) => {
      const usable = row.prospect.contacts.some(
        (contact) =>
          (contact.status === "DISCOVERED" || contact.status === "SELECTED") &&
          contact.email,
      );

      return !usable || row.prospect.outreachStatus === "CONTACT_DISCOVERY_FAILED";
    });

    const batch = pending.slice(0, clampContactDiscoveryBatchSize(pending.length));

    await prisma.prospectContactDiscoveryRun.update({
      where: { id: run.id },
      data: { requested: batch.length },
    });

    if (batch.length === 0) {
      await prisma.prospectContactDiscoveryRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
          errorMessage: null,
        },
      });

      revalidateCampaign(campaignId);

      return {
        success: true,
        campaignId,
        runId: run.id,
        message: "No selected qualified prospects need contact discovery.",
      };
    }

    const results = await runWithConcurrency(
      batch,
      MAX_CONTACT_DISCOVERY_CONCURRENCY,
      async (row) => {
        if (!row.prospect.website) {
          return {
            outcome: "CONTACT_DISCOVERY_FAILED" as const,
            reused: false,
          };
        }

        return discoverProspectContacts({
          prospectId: row.prospectId,
          websiteUrl: row.prospect.website,
        });
      },
    );

    const found = results.filter((row) => row.outcome === "CONTACTS_FOUND").length;
    const noContact = results.filter(
      (row) => row.outcome === "NO_PUBLIC_EMAIL_FOUND",
    ).length;
    const failed = results.filter(
      (row) => row.outcome === "CONTACT_DISCOVERY_FAILED",
    ).length;
    const reused = results.filter((row) => row.reused).length;
    const suppressed = results.filter((row) => row.outcome === "SUPPRESSED").length;

    await prisma.prospectContactDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processed: results.length,
        found,
        noContact,
        failed,
        reused,
        suppressed,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    revalidateCampaign(campaignId);

    return {
      success: true,
      campaignId,
      runId: run.id,
      message: `Checked ${results.length} prospect${results.length === 1 ? "" : "s"} (max ${MAX_CONTACT_DISCOVERY_PER_RUN}). ${found} with contacts, ${noContact} with no public email.`,
    };
  } catch {
    await prisma.prospectContactDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: "Contact discovery could not be completed.",
        completedAt: new Date(),
        durationMs: Date.now() - startedAt,
      },
    });

    return {
      success: false,
      message: "Contact discovery could not be completed.",
      runId: run.id,
    };
  }
}

export async function recheckProspectContacts(
  campaignId: string,
  prospectId: string,
): Promise<ContactActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to find contacts.",
    };
  }

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    include: {
      prospect: {
        select: { website: true },
      },
    },
  });

  if (!membership?.prospect.website) {
    return {
      success: false,
      message: "A public website is required to look for contacts.",
    };
  }

  const result = await discoverProspectContacts({
    prospectId,
    websiteUrl: membership.prospect.website,
    force: true,
  });

  revalidateCampaign(campaignId, prospectId);

  return {
    success:
      result.outcome !== "CONTACT_DISCOVERY_FAILED",
    campaignId,
    prospectId,
    message: result.message,
  };
}

export async function setPrimaryProspectContact(
  campaignId: string,
  prospectId: string,
  contactId: string,
): Promise<ContactActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update contacts.",
    };
  }

  const contact = await prisma.prospectContact.findFirst({
    where: { id: contactId, prospectId },
  });

  if (!contact || contact.status === "REJECTED" || contact.status === "SUPPRESSED") {
    return {
      success: false,
      message: "That contact cannot be selected.",
    };
  }

  await prisma.$transaction([
    prisma.prospectContact.updateMany({
      where: { prospectId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.prospectContact.update({
      where: { id: contact.id },
      data: { isPrimary: true, status: "SELECTED" },
    }),
  ]);

  revalidateCampaign(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: "Primary contact updated. No email was sent.",
  };
}

export async function rejectProspectContact(
  campaignId: string,
  prospectId: string,
  contactId: string,
): Promise<ContactActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update contacts.",
    };
  }

  const contact = await prisma.prospectContact.findFirst({
    where: { id: contactId, prospectId },
  });

  if (!contact) {
    return {
      success: false,
      message: "The contact could not be found.",
    };
  }

  await prisma.prospectContact.update({
    where: { id: contact.id },
    data: { status: "REJECTED", isPrimary: false },
  });

  const next = await prisma.prospectContact.findFirst({
    where: {
      prospectId,
      status: { in: ["DISCOVERED", "SELECTED"] },
    },
    orderBy: { discoveredAt: "asc" },
  });

  if (next) {
    await prisma.prospectContact.update({
      where: { id: next.id },
      data: { isPrimary: true, status: "SELECTED" },
    });
  }

  revalidateCampaign(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: "Contact rejected. No email was sent.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import { parseCampaignInput } from "@/lib/prospecting/campaign";
import { DUPLICATE_WARNING_NOTICE } from "@/lib/prospecting/constants";
import {
  buildDuplicateWarning,
  summarizeDuplicateWarning,
  type DuplicateMatch,
  type DuplicateWarning,
} from "@/lib/prospecting/duplicates";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import {
  isProspectAttachedToCampaign,
  parseProspectInput,
  parseSkipReason,
} from "@/lib/prospecting/prospect";

export interface ProspectingActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  duplicateWarning?: DuplicateWarning;
  duplicateNotice?: string;
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function formStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

async function collectDuplicateMatches(
  hostname: string,
): Promise<DuplicateMatch[]> {
  const [prospects, leads, suppressions] = await Promise.all([
    prisma.prospect.findMany({
      where: { hostname },
      select: {
        id: true,
        businessName: true,
        website: true,
      },
      take: 8,
    }),
    prisma.lead.findMany({
      where: {
        website: {
          contains: hostname,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        company: true,
        website: true,
        firstName: true,
        lastName: true,
      },
      take: 20,
    }),
    prisma.suppressionEntry.findMany({
      where: {
        type: "HOSTNAME",
        value: hostname,
      },
      select: {
        id: true,
        reason: true,
        value: true,
      },
      take: 8,
    }),
  ]);

  const matches: DuplicateMatch[] = prospects.map((prospect) => ({
    kind: "prospect",
    id: prospect.id,
    label: prospect.businessName,
    detail: prospect.website ?? hostname,
  }));

  for (const lead of leads) {
    const leadHostname = tryNormalizeProspectHostname(lead.website);
    if (leadHostname !== hostname) {
      continue;
    }

    matches.push({
      kind: "lead",
      id: lead.id,
      label: lead.company || `${lead.firstName} ${lead.lastName}`.trim(),
      detail: lead.website,
    });
  }

  for (const entry of suppressions) {
    matches.push({
      kind: "suppression",
      id: entry.id,
      label: entry.value,
      detail: `Suppressed (${entry.reason})`,
    });
  }

  return matches;
}

export async function createProspectingCampaign(
  formData: FormData,
): Promise<ProspectingActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to create campaigns.",
    };
  }

  const parsed = parseCampaignInput({
    name: formString(formData, "name"),
    locationLabel: formString(formData, "locationLabel"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    radiusMiles: formString(formData, "radiusMiles"),
    industries: [
      ...formStringList(formData, "industry"),
      formString(formData, "industriesExtra"),
    ],
    desiredQualifiedCount: formString(formData, "desiredQualifiedCount"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error,
    };
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.data.name,
        status: "ACTIVE",
        locationLabel: parsed.data.locationLabel,
        city: parsed.data.city,
        state: parsed.data.state,
        radiusMiles: parsed.data.radiusMiles,
        industries: parsed.data.industries,
        desiredQualifiedCount: parsed.data.desiredQualifiedCount,
        notes: parsed.data.notes,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    revalidatePath("/reports/prospecting");

    return {
      success: true,
      campaignId: campaign.id,
      message: "Campaign created.",
    };
  } catch (error) {
    console.error("Failed to create prospecting campaign:", error);
    return {
      success: false,
      message: "The campaign could not be created.",
    };
  }
}

export async function addCampaignProspect(
  campaignId: string,
  formData: FormData,
): Promise<ProspectingActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to add prospects.",
    };
  }

  if (!campaignId) {
    return {
      success: false,
      message: "A campaign is required.",
    };
  }

  const parsed = parseProspectInput({
    businessName: formString(formData, "businessName"),
    website: formString(formData, "website"),
    industry: formString(formData, "industry"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    address: formString(formData, "address"),
    phone: formString(formData, "phone"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error,
    };
  }

  const confirmDuplicate = formString(formData, "confirmDuplicate") === "true";

  try {
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

    if (parsed.data.hostname) {
      const matches = await collectDuplicateMatches(parsed.data.hostname);
      const duplicateWarning = buildDuplicateWarning(
        parsed.data.hostname,
        matches,
      );

      if (duplicateWarning && !confirmDuplicate) {
        return {
          success: false,
          message: summarizeDuplicateWarning(duplicateWarning),
          duplicateWarning,
          duplicateNotice: DUPLICATE_WARNING_NOTICE,
        };
      }
    }

    const created = await prisma.$transaction(async (transaction) => {
      const prospect = await transaction.prospect.create({
        data: {
          businessName: parsed.data.businessName,
          website: parsed.data.website,
          hostname: parsed.data.hostname,
          industry: parsed.data.industry,
          city: parsed.data.city,
          state: parsed.data.state,
          address: parsed.data.address,
          phone: parsed.data.phone,
          notes: parsed.data.notes,
          sourceType: "MANUAL",
          qualificationStatus: "DISCOVERED",
          outreachStatus: "NOT_READY",
        },
      });

      const existingPairs = await transaction.campaignProspect.findMany({
        where: { campaignId },
        select: { campaignId: true, prospectId: true },
      });

      if (
        isProspectAttachedToCampaign(existingPairs, campaignId, prospect.id)
      ) {
        throw new Error("PROSPECT_ALREADY_ATTACHED");
      }

      await transaction.campaignProspect.create({
        data: {
          campaignId,
          prospectId: prospect.id,
        },
      });

      return prospect;
    });

    revalidatePath("/reports/prospecting");
    revalidatePath(`/reports/prospecting/${campaignId}`);

    return {
      success: true,
      campaignId,
      prospectId: created.id,
      message: "Prospect added to the campaign.",
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        message: "That business is already in this campaign.",
      };
    }

    console.error("Failed to add campaign prospect:", error);
    return {
      success: false,
      message: "The prospect could not be added.",
    };
  }
}

export async function updateCampaignProspect(
  campaignId: string,
  prospectId: string,
  formData: FormData,
): Promise<ProspectingActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update prospects.",
    };
  }

  if (!campaignId || !prospectId) {
    return {
      success: false,
      message: "A campaign and prospect are required.",
    };
  }

  const parsed = parseProspectInput({
    businessName: formString(formData, "businessName"),
    website: formString(formData, "website"),
    industry: formString(formData, "industry"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    address: formString(formData, "address"),
    phone: formString(formData, "phone"),
    notes: formString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error,
    };
  }

  try {
    const membership = await prisma.campaignProspect.findUnique({
      where: {
        campaignId_prospectId: {
          campaignId,
          prospectId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return {
        success: false,
        message: "That prospect is not part of this campaign.",
      };
    }

    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        businessName: parsed.data.businessName,
        website: parsed.data.website,
        hostname: parsed.data.hostname,
        industry: parsed.data.industry,
        city: parsed.data.city,
        state: parsed.data.state,
        address: parsed.data.address,
        phone: parsed.data.phone,
        notes: parsed.data.notes,
      },
    });

    revalidatePath(`/reports/prospecting/${campaignId}`);
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );

    return {
      success: true,
      campaignId,
      prospectId,
      message: "Prospect updated.",
    };
  } catch (error) {
    console.error("Failed to update campaign prospect:", error);
    return {
      success: false,
      message: "The prospect could not be updated.",
    };
  }
}

export async function skipCampaignProspect(
  campaignId: string,
  prospectId: string,
  formData: FormData,
): Promise<ProspectingActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to skip prospects.",
    };
  }

  if (!campaignId || !prospectId) {
    return {
      success: false,
      message: "A campaign and prospect are required.",
    };
  }

  const parsedReason = parseSkipReason(formString(formData, "skipReason"));

  if (!parsedReason.success) {
    return {
      success: false,
      message: parsedReason.error,
    };
  }

  try {
    const membership = await prisma.campaignProspect.findUnique({
      where: {
        campaignId_prospectId: {
          campaignId,
          prospectId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return {
        success: false,
        message: "That prospect is not part of this campaign.",
      };
    }

    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        qualificationStatus: "SKIPPED",
        skipReason: parsedReason.reason,
      },
    });

    revalidatePath(`/reports/prospecting/${campaignId}`);
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );

    return {
      success: true,
      campaignId,
      prospectId,
      message: "Prospect skipped.",
    };
  } catch (error) {
    console.error("Failed to skip campaign prospect:", error);
    return {
      success: false,
      message: "The prospect could not be skipped.",
    };
  }
}

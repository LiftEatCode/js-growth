"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import { findExistingLeadByHostname } from "@/lib/prospecting/leads/find-existing";
import { canConvertProspect } from "@/lib/prospecting/outreach/lifecycle";
import {
  buildSuppressionTargets,
  suppressionReasonForConversion,
} from "@/lib/prospecting/suppression/apply";

export interface ConversionActionResult {
  success: boolean;
  message?: string;
  leadId?: string;
  campaignId?: string;
  prospectId?: string;
}

function revalidateProspect(campaignId: string, prospectId: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath("/reports");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);
}

function normalizeString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function convertProspectingProspectToLead(input: {
  campaignId: string;
  prospectId: string;
  formData: FormData;
  linkExistingLeadId?: string;
}): Promise<ConversionActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to convert prospects.",
    };
  }

  const firstName = normalizeString(input.formData.get("firstName"));
  const lastName = normalizeString(input.formData.get("lastName"));
  const email = normalizeString(input.formData.get("email")).toLowerCase();
  const phone = normalizeString(input.formData.get("phone"));
  const company = normalizeString(input.formData.get("company"));
  const notes = normalizeString(input.formData.get("notes"));

  if (!input.linkExistingLeadId && (!firstName || !lastName || !email)) {
    return {
      success: false,
      message: "First name, last name, and email are required.",
    };
  }

  if (notes.length > 4_000) {
    return {
      success: false,
      message: "Notes must be 4,000 characters or fewer.",
    };
  }

  const prospect = await prisma.prospect.findFirst({
    where: {
      id: input.prospectId,
      campaignProspects: {
        some: { campaignId: input.campaignId },
      },
    },
    include: {
      auditReport: {
        select: {
          id: true,
          website: true,
          leadId: true,
        },
      },
      campaignProspects: {
        where: { campaignId: input.campaignId },
        include: {
          campaign: {
            select: { name: true },
          },
        },
        take: 1,
      },
      outreachMessages: {
        where: {
          campaignId: input.campaignId,
          status: { in: ["SENT", "SUBMITTED"] },
        },
        select: { id: true },
        take: 1,
      },
      outreachOutcomes: {
        orderBy: { occurredAt: "desc" },
        take: 1,
        select: { outcome: true },
      },
    },
  });

  if (!prospect) {
    return {
      success: false,
      message: "The prospect could not be found.",
    };
  }

  const latestOutcome = prospect.outreachOutcomes[0]?.outcome ?? null;

  if (
    !canConvertProspect({
      outreachStatus: prospect.outreachStatus,
      leadId: prospect.leadId,
      hasCompletedOutreach: prospect.outreachMessages.length > 0,
      latestOutcome,
    })
  ) {
    return {
      success: false,
      message: "This prospect is not eligible for conversion yet.",
    };
  }

  const campaignName =
    prospect.campaignProspects[0]?.campaign.name ?? "Prospecting campaign";
  const website =
    prospect.auditReport?.website ??
    prospect.website ??
    (prospect.hostname ? `https://${prospect.hostname}` : "");

  if (!website) {
    return {
      success: false,
      message: "This prospect does not have a usable website for lead conversion.",
    };
  }

  const duplicate = await findExistingLeadByHostname(prospect.hostname);

  if (duplicate && duplicate.id !== input.linkExistingLeadId) {
    return {
      success: false,
      message:
        "An existing lead already uses this website. Link to the existing lead instead of creating a duplicate.",
    };
  }

  const leadId = await prisma.$transaction(async (transaction) => {
    let resolvedLeadId = input.linkExistingLeadId ?? null;

    if (resolvedLeadId) {
      const existing = await transaction.lead.findUnique({
        where: { id: resolvedLeadId },
        select: { id: true },
      });

      if (!existing) {
        throw new Error("The selected lead could not be found.");
      }
    } else {
      const created = await transaction.lead.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          company: company || prospect.businessName || null,
          website,
          status: "NEW",
          contacted: true,
          notes: notes || null,
        },
      });

      resolvedLeadId = created.id;

      await transaction.leadActivity.create({
        data: {
          leadId: created.id,
          type: "CREATED",
          description: `Converted from Prospecting campaign: ${campaignName}`,
          fromValue: prospect.hostname,
          toValue: created.id,
        },
      });
    }

    if (!resolvedLeadId) {
      throw new Error("Lead conversion failed.");
    }

    if (input.linkExistingLeadId) {
      await transaction.leadActivity.create({
        data: {
          leadId: resolvedLeadId,
          type: "MANUAL_NOTE",
          description: `Linked from Prospecting campaign: ${campaignName}`,
          fromValue: prospect.id,
          toValue: resolvedLeadId,
        },
      });
    }

    await transaction.prospect.update({
      where: { id: prospect.id },
      data: {
        leadId: resolvedLeadId,
        outreachStatus: "CONVERTED",
      },
    });

    if (prospect.auditReport && !prospect.auditReport.leadId) {
      await transaction.auditReport.update({
        where: { id: prospect.auditReport.id },
        data: { leadId: resolvedLeadId },
      });
    }

    const suppressionTargets = buildSuppressionTargets({
      hostname: prospect.hostname,
      email: null,
      reason: suppressionReasonForConversion(),
      suppressHostname: Boolean(prospect.hostname),
      suppressEmail: false,
    });

    for (const target of suppressionTargets) {
      const existing = await transaction.suppressionEntry.findFirst({
        where: {
          type: target.type,
          value: target.value,
        },
        select: { id: true },
      });

      if (!existing) {
        await transaction.suppressionEntry.create({ data: target });
      }
    }

    return resolvedLeadId;
  });

  if (prospect.auditReport?.id) {
    revalidatePath(`/reports/${prospect.auditReport.id}`);
  }

  revalidateProspect(input.campaignId, input.prospectId);

  return {
    success: true,
    leadId,
    campaignId: input.campaignId,
    prospectId: input.prospectId,
    message: input.linkExistingLeadId
      ? "Prospect linked to existing lead."
      : "Prospect converted to lead.",
  };
}

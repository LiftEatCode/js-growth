"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import { canToggleManualOutreachSelection } from "@/lib/prospecting/selection/outreach-selection";

export interface SelectionActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
}

function revalidateProspect(campaignId: string, prospectId: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);
}

export async function setProspectOutreachSelection(
  campaignId: string,
  prospectId: string,
  selected: boolean,
): Promise<SelectionActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to change outreach selection.",
    };
  }

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId,
        prospectId,
      },
    },
    include: {
      prospect: {
        select: {
          qualificationStatus: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      success: false,
      message: "The prospect is not in this campaign.",
    };
  }

  if (selected) {
    const toggle = canToggleManualOutreachSelection({
      qualificationStatus: membership.prospect.qualificationStatus,
    });

    if (!toggle.allowed) {
      return {
        success: false,
        message: toggle.reason,
      };
    }
  }

  await prisma.campaignProspect.update({
    where: {
      campaignId_prospectId: {
        campaignId,
        prospectId,
      },
    },
    data: {
      isSelectedForOutreach: selected,
    },
  });

  revalidateProspect(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: selected
      ? "Prospect selected for outreach."
      : "Prospect removed from manual outreach selection.",
  };
}

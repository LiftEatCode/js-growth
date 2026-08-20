import type { Prisma } from "@/generated/prisma/client";

export type OutreachSelectionKind =
  | "TOP_N"
  | "MANUAL"
  | "TOP_N_AND_MANUAL"
  | "NONE";

export interface CampaignProspectSelectionFlags {
  isSelectedTopN: boolean;
  isSelectedForOutreach: boolean;
}

export function isProspectSelectedForOutreach(
  membership: CampaignProspectSelectionFlags,
): boolean {
  return membership.isSelectedTopN || membership.isSelectedForOutreach;
}

export function campaignProspectEffectiveOutreachWhere(): Pick<
  Prisma.CampaignProspectWhereInput,
  "OR"
> {
  return {
    OR: [{ isSelectedTopN: true }, { isSelectedForOutreach: true }],
  };
}

export function outreachSelectionKind(
  membership: CampaignProspectSelectionFlags,
): OutreachSelectionKind {
  if (membership.isSelectedTopN && membership.isSelectedForOutreach) {
    return "TOP_N_AND_MANUAL";
  }

  if (membership.isSelectedTopN) {
    return "TOP_N";
  }

  if (membership.isSelectedForOutreach) {
    return "MANUAL";
  }

  return "NONE";
}

export function outreachSelectionLabel(
  kind: OutreachSelectionKind,
): string | null {
  switch (kind) {
    case "TOP_N":
      return "Top N";
    case "MANUAL":
      return "Selected manually";
    case "TOP_N_AND_MANUAL":
      return "Top N + Manual";
    default:
      return null;
  }
}

export function canToggleManualOutreachSelection(input: {
  qualificationStatus: string;
}):
  | { allowed: true }
  | { allowed: false; reason: string } {
  if (input.qualificationStatus !== "QUALIFIED") {
    return {
      allowed: false,
      reason: "Only qualified prospects can be selected for outreach.",
    };
  }

  return { allowed: true };
}

export function isProspectEligibleForOutreachWorkflow(input: {
  membership: CampaignProspectSelectionFlags;
  qualificationStatus: string;
}): boolean {
  return (
    input.qualificationStatus === "QUALIFIED" &&
    isProspectSelectedForOutreach(input.membership)
  );
}

export function qualifiedProspectWithOutreachChannelWhere(): Prisma.ProspectWhereInput {
  return {
    qualificationStatus: "QUALIFIED",
    OR: [
      {
        contacts: {
          some: {
            isPrimary: true,
            status: { in: ["SELECTED", "DISCOVERED"] },
          },
        },
      },
      {
        contactForms: {
          some: {
            isPrimary: true,
            status: { in: ["SELECTED", "DISCOVERED"] },
          },
        },
      },
    ],
  };
}

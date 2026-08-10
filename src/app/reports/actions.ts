"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auditReportRepository } from "@/lib/website-audit/storage";

export interface DeleteReportResult {
  success: boolean;
  message?: string;
}

export interface UpdateLeadContactedResult {
  success: boolean;
  message?: string;
  contacted?: boolean;
}

export async function deleteReport(
  reportId: string,
): Promise<DeleteReportResult> {
  if (!reportId) {
    return {
      success: false,
      message: "A report ID is required.",
    };
  }

  try {
    const deleted =
      await auditReportRepository.delete(
        reportId,
      );

    if (!deleted) {
      return {
        success: false,
        message:
          "The report could not be deleted.",
      };
    }

    revalidatePath("/reports");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Failed to delete audit report:",
      error,
    );

    return {
      success: false,
      message:
        "An unexpected error occurred while deleting the report.",
    };
  }
}

export async function updateLeadContacted(
  leadId: string,
  contacted: boolean,
): Promise<UpdateLeadContactedResult> {
  if (!leadId) {
    return {
      success: false,
      message:
        "A lead ID is required.",
    };
  }

  try {
    const lead =
      await prisma.lead.update({
        where: {
          id: leadId,
        },

        data: {
          contacted,
        },

        select: {
          contacted: true,
        },
      });

    revalidatePath("/reports");

    return {
      success: true,
      contacted:
        lead.contacted,
    };
  } catch (error) {
    console.error(
      "Failed to update lead contacted state:",
      error,
    );

    return {
      success: false,
      message:
        "The lead status could not be updated.",
    };
  }
}
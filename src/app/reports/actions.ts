"use server";

import { revalidatePath } from "next/cache";

import { auditReportRepository } from "@/lib/website-audit/storage";

export interface DeleteReportResult {
  success: boolean;
  message?: string;
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
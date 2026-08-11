"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface UpdateLeadDetailsResult {
  success: boolean;
  message?: string;
}

function normalizeString(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function updateLeadDetails(
  leadId: string,
  reportId: string,
  formData: FormData,
): Promise<UpdateLeadDetailsResult> {
  const session =
    await getInternalSession();

  if (!session) {
    return {
      success: false,
      message:
        "You are not authorized to update lead details.",
    };
  }

  if (!leadId) {
    return {
      success: false,
      message:
        "A lead ID is required.",
    };
  }

  const firstName =
    normalizeString(
      formData.get("firstName"),
    );

  const lastName =
    normalizeString(
      formData.get("lastName"),
    );

  const email =
    normalizeString(
      formData.get("email"),
    ).toLowerCase();

  const phone =
    normalizeString(
      formData.get("phone"),
    );

  const company =
    normalizeString(
      formData.get("company"),
    );

  if (!firstName) {
    return {
      success: false,
      message:
        "First name is required.",
    };
  }

  if (!lastName) {
    return {
      success: false,
      message:
        "Last name is required.",
    };
  }

  if (!email) {
    return {
      success: false,
      message:
        "Email is required.",
    };
  }

  try {
    const existingLead =
      await prisma.lead.findUnique({
        where: {
          id: leadId,
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
        },
      });

    if (!existingLead) {
      return {
        success: false,
        message:
          "The lead could not be found.",
      };
    }

    const normalizedExistingEmail =
      existingLead.email
        .trim()
        .toLowerCase();

    const normalizedExistingPhone =
      existingLead.phone?.trim() ??
      "";

    const normalizedExistingCompany =
      existingLead.company?.trim() ??
      "";

    const changes: string[] = [];

    if (
      existingLead.firstName !==
      firstName
    ) {
      changes.push(
        `First name changed from "${existingLead.firstName}" to "${firstName}".`,
      );
    }

    if (
      existingLead.lastName !==
      lastName
    ) {
      changes.push(
        `Last name changed from "${existingLead.lastName}" to "${lastName}".`,
      );
    }

    if (
      normalizedExistingEmail !==
      email
    ) {
      changes.push(
        `Email changed from "${existingLead.email}" to "${email}".`,
      );
    }

    if (
      normalizedExistingPhone !==
      phone
    ) {
      changes.push(
        phone
          ? `Phone changed from "${existingLead.phone ?? "None"}" to "${phone}".`
          : `Phone removed. Previous value was "${existingLead.phone ?? "None"}".`,
      );
    }

    if (
      normalizedExistingCompany !==
      company
    ) {
      changes.push(
        company
          ? `Company changed from "${existingLead.company ?? "None"}" to "${company}".`
          : `Company removed. Previous value was "${existingLead.company ?? "None"}".`,
      );
    }

    if (changes.length === 0) {
      return {
        success: true,
        message:
          "No lead detail changes to save.",
      };
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.lead.update({
          where: {
            id: leadId,
          },

          data: {
            firstName,
            lastName,
            email,

            phone:
              phone ||
              null,

            company:
              company ||
              null,
          },
        });

        await transaction.leadActivity.create({
          data: {
            leadId,

            type:
              "MANUAL_NOTE",

            description:
              "Lead contact details updated.",

            fromValue:
              "CONTACT_EDIT",

            toValue:
              changes.join("\n"),
          },
        });
      },
    );

    revalidatePath(
      "/reports",
    );

    if (reportId) {
      revalidatePath(
        `/reports/${reportId}`,
      );
    }

    return {
      success: true,
      message:
        "Lead details updated.",
    };
  } catch (error) {
    console.error(
      "Failed to update lead details:",
      error,
    );

    return {
      success: false,
      message:
        "The lead details could not be updated.",
    };
  }
}
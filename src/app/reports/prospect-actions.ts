"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface ConvertProspectToLeadResult {
  success: boolean;
  message?: string;
  leadId?: string;
}

function normalizeString(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseDateInput(
  value: string,
): Date | null {
  if (!value) {
    return null;
  }

  const parsed =
    new Date(
      `${value}T12:00:00`,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }

  return parsed;
}

export async function convertProspectToLead(
  reportId: string,
  formData: FormData,
): Promise<ConvertProspectToLeadResult> {
  const session =
    await getInternalSession();

  if (!session) {
    return {
      success: false,
      message:
        "You are not authorized to create leads.",
    };
  }

  if (!reportId) {
    return {
      success: false,
      message:
        "A report ID is required.",
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

  const notes =
    normalizeString(
      formData.get("notes"),
    );

  const followUpValue =
    normalizeString(
      formData.get("followUpAt"),
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

  if (
    notes.length >
    4000
  ) {
    return {
      success: false,
      message:
        "Notes must be 4,000 characters or fewer.",
    };
  }

  let followUpAt:
    | Date
    | null = null;

  if (followUpValue) {
    followUpAt =
      parseDateInput(
        followUpValue,
      );

    if (!followUpAt) {
      return {
        success: false,
        message:
          "Enter a valid follow-up date.",
      };
    }
  }

  try {
    const report =
      await prisma.auditReport.findUnique({
        where: {
          id: reportId,
        },

        select: {
          id: true,
          website: true,
          hostname: true,
          leadId: true,
        },
      });

    if (!report) {
      return {
        success: false,
        message:
          "The audit report could not be found.",
      };
    }

    if (report.leadId) {
      return {
        success: false,
        message:
          "This audit is already connected to a lead.",
      };
    }

    const lead =
      await prisma.$transaction(
        async (transaction) => {
          const createdLead =
            await transaction.lead.create({
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

                website:
                  report.website,

                status:
                  "NEW",

                contacted:
                  false,

                followUpAt,

                notes:
                  notes ||
                  null,
              },
            });

          await transaction.auditReport.update({
            where: {
              id:
                report.id,
            },

            data: {
              leadId:
                createdLead.id,
            },
          });

          await transaction.leadActivity.create({
            data: {
              leadId:
                createdLead.id,

              type:
                "CREATED",

              description:
                "Lead created manually from an audited prospect.",

              fromValue:
                report.hostname,

              toValue:
                createdLead.id,
            },
          });

          if (followUpAt) {
            await transaction.leadActivity.create({
              data: {
                leadId:
                  createdLead.id,

                type:
                  "FOLLOW_UP_CHANGED",

                description:
                  `Initial follow-up scheduled for ${new Intl.DateTimeFormat(
                    "en-US",
                    {
                      dateStyle:
                        "medium",
                    },
                  ).format(
                    followUpAt,
                  )}.`,

                fromValue:
                  null,

                toValue:
                  followUpAt.toISOString(),
              },
            });
          }

          if (notes) {
            await transaction.leadActivity.create({
              data: {
                leadId:
                  createdLead.id,

                type:
                  "NOTES_UPDATED",

                description:
                  "Initial internal notes added.",

                fromValue:
                  null,

                toValue:
                  notes,
              },
            });
          }

          return createdLead;
        },
      );

    revalidatePath(
      "/reports",
    );

    revalidatePath(
      `/reports/${reportId}`,
    );

    return {
      success: true,
      message:
        "Prospect converted to lead.",
      leadId:
        lead.id,
    };
  } catch (error) {
    console.error(
      "Failed to convert prospect to lead:",
      error,
    );

    return {
      success: false,
      message:
        "The prospect could not be converted to a lead.",
    };
  }
}
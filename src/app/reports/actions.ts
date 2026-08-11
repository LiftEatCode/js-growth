"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
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

export interface UpdateLeadPipelineResult {
  success: boolean;
  message?: string;
}

export interface AddLeadActivityResult {
  success: boolean;
  message?: string;
}

const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "WON",
  "LOST",
] as const;

const MANUAL_ACTIVITY_TYPES = [
  "CALL",
  "EMAIL",
  "MEETING",
  "FOLLOW_UP",
  "NOTE",
] as const;

type LeadStatusValue =
  (typeof LEAD_STATUSES)[number];

type ManualActivityValue =
  (typeof MANUAL_ACTIVITY_TYPES)[number];

async function isAuthorized(): Promise<boolean> {
  const session =
    await getInternalSession();

  return session !== null;
}

function isLeadStatus(
  value: string,
): value is LeadStatusValue {
  return LEAD_STATUSES.includes(
    value as LeadStatusValue,
  );
}

function isManualActivityType(
  value: string,
): value is ManualActivityValue {
  return MANUAL_ACTIVITY_TYPES.includes(
    value as ManualActivityValue,
  );
}

function normalizeString(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getStatusLabel(
  status: LeadStatusValue,
): string {
  if (status === "NEW") {
    return "New";
  }

  if (status === "CONTACTED") {
    return "Contacted";
  }

  if (status === "QUALIFIED") {
    return "Qualified";
  }

  if (status === "PROPOSAL") {
    return "Proposal";
  }

  if (status === "WON") {
    return "Won";
  }

  return "Lost";
}

function getManualActivityLabel(
  type: ManualActivityValue,
): string {
  if (type === "CALL") {
    return "Call";
  }

  if (type === "EMAIL") {
    return "Email";
  }

  if (type === "MEETING") {
    return "Meeting";
  }

  if (type === "FOLLOW_UP") {
    return "Follow-Up";
  }

  return "Note";
}

function getDateKey(
  value: Date | null,
): string | null {
  if (!value) {
    return null;
  }

  return value
    .toISOString()
    .slice(0, 10);
}

function formatActivityDate(
  value: Date | null,
): string {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(value);
}

export async function deleteReport(
  reportId: string,
): Promise<DeleteReportResult> {
  if (!(await isAuthorized())) {
    return {
      success: false,
      message:
        "You are not authorized to delete reports.",
    };
  }

  if (!reportId) {
    return {
      success: false,
      message:
        "A report ID is required.",
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
  if (!(await isAuthorized())) {
    return {
      success: false,
      message:
        "You are not authorized to update leads.",
    };
  }

  if (!leadId) {
    return {
      success: false,
      message:
        "A lead ID is required.",
    };
  }

  try {
    const existingLead =
      await prisma.lead.findUnique({
        where: {
          id: leadId,
        },

        select: {
          status: true,
          contacted: true,
        },
      });

    if (!existingLead) {
      return {
        success: false,
        message:
          "The lead could not be found.",
      };
    }

    const nextStatus =
      contacted
        ? "CONTACTED"
        : "NEW";

    const lead =
      await prisma.$transaction(
        async (transaction) => {
          const updatedLead =
            await transaction.lead.update({
              where: {
                id: leadId,
              },

              data: {
                contacted,
                status:
                  nextStatus,
              },

              select: {
                contacted: true,
                status: true,
              },
            });

          if (
            existingLead.status !==
            nextStatus
          ) {
            await transaction.leadActivity.create({
              data: {
                leadId,

                type:
                  "STATUS_CHANGED",

                description:
                  `Pipeline status changed from ${getStatusLabel(
                    existingLead.status,
                  )} to ${getStatusLabel(
                    nextStatus,
                  )}.`,

                fromValue:
                  existingLead.status,

                toValue:
                  nextStatus,
              },
            });
          }

          return updatedLead;
        },
      );

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

export async function updateLeadPipeline(
  leadId: string,
  reportId: string,
  formData: FormData,
): Promise<UpdateLeadPipelineResult> {
  if (!(await isAuthorized())) {
    return {
      success: false,
      message:
        "You are not authorized to update the sales pipeline.",
    };
  }

  if (!leadId) {
    return {
      success: false,
      message:
        "A lead ID is required.",
    };
  }

  const status =
    normalizeString(
      formData.get("status"),
    );

  const followUpAtValue =
    normalizeString(
      formData.get(
        "followUpAt",
      ),
    );

  const notes =
    normalizeString(
      formData.get("notes"),
    );

  if (!isLeadStatus(status)) {
    return {
      success: false,
      message:
        "Select a valid lead status.",
    };
  }

  let followUpAt:
    | Date
    | null = null;

  if (followUpAtValue) {
    const parsedDate =
      new Date(
        `${followUpAtValue}T12:00:00`,
      );

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return {
        success: false,
        message:
          "Enter a valid follow-up date.",
      };
    }

    followUpAt =
      parsedDate;
  }

  try {
    const existingLead =
      await prisma.lead.findUnique({
        where: {
          id: leadId,
        },

        select: {
          status: true,
          followUpAt: true,
          notes: true,
        },
      });

    if (!existingLead) {
      return {
        success: false,
        message:
          "The lead could not be found.",
      };
    }

    const existingNotes =
      existingLead.notes?.trim() ??
      "";

    const statusChanged =
      existingLead.status !==
      status;

    const followUpChanged =
      getDateKey(
        existingLead.followUpAt,
      ) !==
      getDateKey(
        followUpAt,
      );

    const notesChanged =
      existingNotes !== notes;

    if (
      !statusChanged &&
      !followUpChanged &&
      !notesChanged
    ) {
      return {
        success: true,
        message:
          "No changes to save.",
      };
    }

    await prisma.$transaction(
      async (transaction) => {
        await transaction.lead.update({
          where: {
            id: leadId,
          },

          data: {
            status,

            followUpAt,

            notes:
              notes || null,

            contacted:
              status !== "NEW",
          },
        });

        if (statusChanged) {
          await transaction.leadActivity.create({
            data: {
              leadId,

              type:
                "STATUS_CHANGED",

              description:
                `Pipeline status changed from ${getStatusLabel(
                  existingLead.status,
                )} to ${getStatusLabel(
                  status,
                )}.`,

              fromValue:
                existingLead.status,

              toValue:
                status,
            },
          });
        }

        if (followUpChanged) {
          await transaction.leadActivity.create({
            data: {
              leadId,

              type:
                "FOLLOW_UP_CHANGED",

              description:
                followUpAt
                  ? `Follow-up scheduled for ${formatActivityDate(
                      followUpAt,
                    )}.`
                  : "Follow-up date removed.",

              fromValue:
                existingLead.followUpAt?.toISOString() ??
                null,

              toValue:
                followUpAt?.toISOString() ??
                null,
            },
          });
        }

        if (notesChanged) {
          await transaction.leadActivity.create({
            data: {
              leadId,

              type:
                "NOTES_UPDATED",

              description:
                notes
                  ? "Internal notes updated."
                  : "Internal notes cleared.",

              fromValue:
                existingLead.notes,

              toValue:
                notes || null,
            },
          });
        }
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
        "Lead pipeline updated.",
    };
  } catch (error) {
    console.error(
      "Failed to update lead pipeline:",
      error,
    );

    return {
      success: false,
      message:
        "The lead pipeline could not be updated.",
    };
  }
}

export async function addLeadActivity(
  leadId: string,
  reportId: string,
  formData: FormData,
): Promise<AddLeadActivityResult> {
  if (!(await isAuthorized())) {
    return {
      success: false,
      message:
        "You are not authorized to add lead activity.",
    };
  }

  if (!leadId) {
    return {
      success: false,
      message:
        "A lead ID is required.",
    };
  }

  const activityType =
    normalizeString(
      formData.get(
        "activityType",
      ),
    );

  const activityText =
    normalizeString(
      formData.get(
        "activityText",
      ),
    );

  if (
    !isManualActivityType(
      activityType,
    )
  ) {
    return {
      success: false,
      message:
        "Select a valid activity type.",
    };
  }

  if (!activityText) {
    return {
      success: false,
      message:
        "Enter a note for this activity.",
    };
  }

  if (
    activityText.length >
    4000
  ) {
    return {
      success: false,
      message:
        "Activity notes must be 4,000 characters or fewer.",
    };
  }

  try {
    const lead =
      await prisma.lead.findUnique({
        where: {
          id: leadId,
        },

        select: {
          id: true,
        },
      });

    if (!lead) {
      return {
        success: false,
        message:
          "The lead could not be found.",
      };
    }

    const label =
      getManualActivityLabel(
        activityType,
      );

    await prisma.leadActivity.create({
      data: {
        leadId,

        type:
          "MANUAL_NOTE",

        description:
          `${label} activity logged.`,

        fromValue:
          activityType,

        toValue:
          activityText,
      },
    });

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
        `${label} activity added.`,
    };
  } catch (error) {
    console.error(
      "Failed to add lead activity:",
      error,
    );

    return {
      success: false,
      message:
        "The activity could not be saved.",
    };
  }
}
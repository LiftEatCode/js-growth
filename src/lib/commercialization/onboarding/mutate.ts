import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { isOnboardingItemSatisfied } from "./checklist";
import {
  ONBOARDING_ITEM_STATUSES,
  type ClientProjectStatusValue,
  type OnboardingItemStatusValue,
} from "./constants";
import { canCompleteProject, deriveOnboardingState } from "./derive";
import { getOnboardingEligibility } from "./eligibility";
import { loadPaymentsForAgreement } from "@/lib/commercialization/payments/load";
import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";

const CREDENTIAL_NOTE_PATTERN =
  /\b(password|passwd|pwd|secret|api[_-]?key|credential|login\s*:\s*\S+)/i;

export type OnboardingMutationResult =
  | { ok: true; projectId: string; message?: string }
  | { ok: false; code: string; message: string };

export async function updateOnboardingItemStatus(options: {
  projectId: string;
  itemId: string;
  status: OnboardingItemStatusValue;
  actorEmail: string;
  notes?: string | null;
}): Promise<OnboardingMutationResult> {
  if (!ONBOARDING_ITEM_STATUSES.includes(options.status)) {
    return { ok: false, code: "INVALID_STATUS", message: "Invalid status." };
  }

  const notes = options.notes?.trim() || null;
  if (notes && CREDENTIAL_NOTE_PATTERN.test(notes)) {
    return {
      ok: false,
      code: "CREDENTIALS_FORBIDDEN",
      message:
        "Do not store passwords or credentials in onboarding notes. Use platform invitations / delegated access.",
    };
  }

  const item = await prisma.projectOnboardingItem.findFirst({
    where: { id: options.itemId, projectId: options.projectId },
  });
  if (!item) {
    return { ok: false, code: "NOT_FOUND", message: "Checklist item not found." };
  }

  const project = await prisma.clientProject.findUnique({
    where: { id: options.projectId },
  });
  if (!project) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found." };
  }

  const completedAt = isOnboardingItemSatisfied(options.status)
    ? new Date()
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.projectOnboardingItem.update({
      where: { id: item.id },
      data: {
        status: options.status,
        notes,
        completedAt,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        type: "ONBOARDING_ITEM_UPDATED",
        actorEmail: options.actorEmail,
        fromValueJson: {
          key: item.key,
          status: item.status,
        } as Prisma.InputJsonValue,
        toValueJson: {
          key: item.key,
          status: options.status,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: project.opportunityId,
        type: "ONBOARDING_ITEM_UPDATED",
        actorEmail: options.actorEmail,
        toValueJson: {
          projectId: project.id,
          key: item.key,
          status: options.status,
        } as Prisma.InputJsonValue,
      },
    });

    const items = await tx.projectOnboardingItem.findMany({
      where: { projectId: project.id },
    });
    const allRequiredDone = items
      .filter((i) => i.required)
      .every((i) => isOnboardingItemSatisfied(i.status));

    if (
      allRequiredDone &&
      (project.status === "ONBOARDING" || project.status === "READY")
    ) {
      if (project.status !== "READY") {
        await tx.clientProject.update({
          where: { id: project.id },
          data: { status: "READY" },
        });
        await tx.projectActivity.create({
          data: {
            projectId: project.id,
            type: "PROJECT_READY_FOR_KICKOFF",
            actorEmail: options.actorEmail,
          },
        });
        await tx.opportunityActivity.create({
          data: {
            opportunityId: project.opportunityId,
            type: "PROJECT_READY_FOR_KICKOFF",
            actorEmail: options.actorEmail,
            toValueJson: { projectId: project.id } as Prisma.InputJsonValue,
          },
        });
      }
    }
  });

  return { ok: true, projectId: options.projectId };
}

export async function startClientProject(options: {
  projectId: string;
  actorEmail: string;
}): Promise<OnboardingMutationResult> {
  const project = await prisma.clientProject.findUnique({
    where: { id: options.projectId },
    include: { onboardingItems: true },
  });
  if (!project) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found." };
  }

  if (project.status === "ACTIVE") {
    return {
      ok: true,
      projectId: project.id,
      message: "Project already active.",
    };
  }

  const onboardingState = deriveOnboardingState({
    projectStatus: project.status as ClientProjectStatusValue,
    items: project.onboardingItems.map((i) => ({
      required: i.required,
      status: i.status,
    })),
    balanceOutstandingCents: 0,
    allRequiredDeliveryTasksComplete: false,
  });

  if (
    project.status !== "READY" &&
    onboardingState !== "READY_FOR_KICKOFF"
  ) {
    return {
      ok: false,
      code: "NOT_READY",
      message: "Complete required onboarding checklist items before starting.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: project.id },
      data: {
        status: "ACTIVE",
        startedAt: project.startedAt ?? new Date(),
      },
    });
    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        type: "PROJECT_STARTED",
        actorEmail: options.actorEmail,
        fromValueJson: { status: project.status } as Prisma.InputJsonValue,
        toValueJson: { status: "ACTIVE" } as Prisma.InputJsonValue,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: project.opportunityId,
        type: "PROJECT_STARTED",
        actorEmail: options.actorEmail,
        toValueJson: { projectId: project.id } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, projectId: project.id, message: "Project started." };
}

export async function updateDeliveryTaskStatus(options: {
  projectId: string;
  taskId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  actorEmail: string;
  internalNotes?: string | null;
}): Promise<OnboardingMutationResult> {
  const task = await prisma.projectDeliveryTask.findFirst({
    where: { id: options.taskId, projectId: options.projectId },
  });
  if (!task) {
    return { ok: false, code: "NOT_FOUND", message: "Delivery task not found." };
  }

  const completedAt =
    options.status === "COMPLETED" ? new Date() : null;

  await prisma.$transaction(async (tx) => {
    await tx.projectDeliveryTask.update({
      where: { id: task.id },
      data: {
        status: options.status,
        completedAt,
        internalNotes: options.internalNotes?.trim() || task.internalNotes,
      },
    });

    // Keep presentation deliverables in sync when linked to this task.
    await tx.projectDeliverable.updateMany({
      where: { deliveryTaskId: task.id },
      data: {
        status:
          options.status === "COMPLETED"
            ? "COMPLETED"
            : options.status === "BLOCKED"
              ? "BLOCKED"
              : options.status === "IN_PROGRESS"
                ? "IN_PROGRESS"
                : "NOT_STARTED",
        completedAt,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: options.projectId,
        type: "DELIVERY_TASK_UPDATED",
        actorEmail: options.actorEmail,
        fromValueJson: {
          taskId: task.id,
          status: task.status,
        } as Prisma.InputJsonValue,
        toValueJson: {
          taskId: task.id,
          status: options.status,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, projectId: options.projectId };
}

export async function completeClientProject(options: {
  projectId: string;
  actorEmail: string;
  overrideReason?: string | null;
}): Promise<OnboardingMutationResult> {
  const project = await prisma.clientProject.findUnique({
    where: { id: options.projectId },
    include: { deliveryTasks: true },
  });
  if (!project) {
    return { ok: false, code: "NOT_FOUND", message: "Project not found." };
  }

  const payments = await loadPaymentsForAgreement({
    agreementId: project.agreementId,
  });
  const agreement = await prisma.commercialAgreement.findUnique({
    where: { id: project.agreementId },
  });

  const eligibility = getOnboardingEligibility({
    agreement: agreement
      ? {
          agreementId: agreement.id,
          opportunityId: agreement.opportunityId,
          status: agreement.status,
          currency: agreement.currency,
          paymentTermType: agreement.paymentTermType as AgreementPaymentTermType,
          totalInvestmentCents: agreement.totalInvestmentCents,
          depositCents: agreement.depositCents,
          balanceCents: agreement.balanceCents,
          paymentCustomText: agreement.paymentCustomText,
          businessName: "Client",
        }
      : null,
    payments,
  });

  const allComplete =
    project.deliveryTasks.length === 0 ||
    project.deliveryTasks.every((t) => t.status === "COMPLETED");

  const gate = canCompleteProject({
    projectStatus: project.status as ClientProjectStatusValue,
    allRequiredDeliveryTasksComplete: allComplete,
    paidInFull: eligibility.paidInFull,
    overrideReason: options.overrideReason,
  });

  if (!gate.ok) {
    return { ok: false, code: gate.code, message: gate.reason };
  }

  await prisma.$transaction(async (tx) => {
    await tx.clientProject.update({
      where: { id: project.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        type: "PROJECT_COMPLETED",
        actorEmail: options.actorEmail,
        note: options.overrideReason?.trim() || null,
        toValueJson: {
          paidInFull: eligibility.paidInFull,
          override: !!options.overrideReason?.trim(),
        } as Prisma.InputJsonValue,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: project.opportunityId,
        type: "PROJECT_COMPLETED",
        actorEmail: options.actorEmail,
        note: options.overrideReason?.trim() || null,
        toValueJson: { projectId: project.id } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, projectId: project.id, message: "Project completed." };
}

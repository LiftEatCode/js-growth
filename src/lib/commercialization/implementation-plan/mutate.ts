import "server-only";

import { prisma } from "@/lib/prisma";

import type { ImplementationPriority } from "./types";

export type MutatePlanErrorCode =
  | "not_found"
  | "forbidden_status"
  | "workstream_not_found";

async function loadEditablePlan(options: {
  planId: string;
  campaignId: string;
  prospectId: string;
}) {
  return prisma.implementationPlan.findFirst({
    where: {
      id: options.planId,
      campaignId: options.campaignId,
      prospectId: options.prospectId,
    },
    include: { workstreams: true },
  });
}

/**
 * Material edits on an APPROVED plan revert it to DRAFT and clear approval.
 */
async function invalidateApprovalIfNeeded(planId: string, status: string) {
  if (status !== "APPROVED") {
    return;
  }

  await prisma.implementationPlan.update({
    where: { id: planId },
    data: {
      status: "DRAFT",
      approvedAt: null,
      approvedByEmail: null,
    },
  });
}

export async function removeImplementationWorkstream(options: {
  planId: string;
  workstreamId: string;
  campaignId: string;
  prospectId: string;
}): Promise<{ ok: true } | { ok: false; code: MutatePlanErrorCode; message: string }> {
  const plan = await loadEditablePlan(options);

  if (!plan || plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "not_found",
      message: "Implementation plan not found.",
    };
  }

  const workstream = plan.workstreams.find((row) => row.id === options.workstreamId);
  if (!workstream) {
    return {
      ok: false,
      code: "workstream_not_found",
      message: "Workstream not found on this plan.",
    };
  }

  await prisma.implementationPlanWorkstream.update({
    where: { id: workstream.id },
    data: { removed: true },
  });

  await invalidateApprovalIfNeeded(plan.id, plan.status);

  return { ok: true };
}

export async function setImplementationWorkstreamPriority(options: {
  planId: string;
  workstreamId: string;
  campaignId: string;
  prospectId: string;
  priority: ImplementationPriority;
}): Promise<{ ok: true } | { ok: false; code: MutatePlanErrorCode; message: string }> {
  const plan = await loadEditablePlan(options);

  if (!plan || plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "not_found",
      message: "Implementation plan not found.",
    };
  }

  const workstream = plan.workstreams.find((row) => row.id === options.workstreamId);
  if (!workstream) {
    return {
      ok: false,
      code: "workstream_not_found",
      message: "Workstream not found on this plan.",
    };
  }

  await prisma.implementationPlanWorkstream.update({
    where: { id: workstream.id },
    data: { priority: options.priority },
  });

  await invalidateApprovalIfNeeded(plan.id, plan.status);

  return { ok: true };
}

export async function reorderImplementationWorkstream(options: {
  planId: string;
  workstreamId: string;
  campaignId: string;
  prospectId: string;
  direction: "up" | "down";
}): Promise<{ ok: true } | { ok: false; code: MutatePlanErrorCode; message: string }> {
  const plan = await loadEditablePlan(options);

  if (!plan || plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "not_found",
      message: "Implementation plan not found.",
    };
  }

  const active = plan.workstreams
    .filter((row) => !row.removed)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const index = active.findIndex((row) => row.id === options.workstreamId);
  if (index < 0) {
    return {
      ok: false,
      code: "workstream_not_found",
      message: "Workstream not found on this plan.",
    };
  }

  const swapWith =
    options.direction === "up" ? active[index - 1] : active[index + 1];

  if (!swapWith) {
    return { ok: true };
  }

  const current = active[index];

  await prisma.$transaction([
    prisma.implementationPlanWorkstream.update({
      where: { id: current.id },
      data: { sortOrder: swapWith.sortOrder },
    }),
    prisma.implementationPlanWorkstream.update({
      where: { id: swapWith.id },
      data: { sortOrder: current.sortOrder },
    }),
  ]);

  await invalidateApprovalIfNeeded(plan.id, plan.status);

  return { ok: true };
}

export async function setImplementationPlanOperatorNotes(options: {
  planId: string;
  campaignId: string;
  prospectId: string;
  notes: string;
}): Promise<{ ok: true } | { ok: false; code: MutatePlanErrorCode; message: string }> {
  const plan = await loadEditablePlan(options);

  if (!plan || plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "not_found",
      message: "Implementation plan not found.",
    };
  }

  const trimmed = options.notes.trim().slice(0, 4000);

  await prisma.implementationPlan.update({
    where: { id: plan.id },
    data: { operatorNotes: trimmed.length > 0 ? trimmed : null },
  });

  // Notes alone do not invalidate approval

  return { ok: true };
}

export async function approveImplementationPlan(options: {
  planId: string;
  campaignId: string;
  prospectId: string;
  approvedByEmail: string;
}): Promise<{ ok: true } | { ok: false; code: MutatePlanErrorCode; message: string }> {
  const plan = await loadEditablePlan(options);

  if (!plan || plan.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "not_found",
      message: "Implementation plan not found.",
    };
  }

  const activeCount = plan.workstreams.filter((row) => !row.removed).length;
  if (activeCount === 0) {
    return {
      ok: false,
      code: "forbidden_status",
      message: "Approve requires at least one active workstream.",
    };
  }

  await prisma.implementationPlan.update({
    where: { id: plan.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByEmail: options.approvedByEmail,
    },
  });

  return { ok: true };
}

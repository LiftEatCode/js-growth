import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import {
  getServiceCapability,
  listActiveServiceCapabilities,
} from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { prisma } from "@/lib/prisma";

import {
  MAX_ASSUMPTION_CHARS,
  MAX_ASSUMPTIONS,
  MAX_DELIVERABLE_DESCRIPTION_CHARS,
  MAX_DELIVERABLE_TITLE_CHARS,
  MAX_EXCLUSION_CHARS,
  MAX_EXCLUSIONS,
  MAX_SCOPE_SUMMARY_CHARS,
  MAX_SCOPE_TITLE_CHARS,
  MAX_SECTION_DESCRIPTION_CHARS,
  MAX_SECTION_TITLE_CHARS,
  type ScopeDeliverableType,
} from "./constants";
import type { ScopeAssumption, ScopeExclusion } from "./types";

export type ScopeMutationResult =
  | { ok: true; scopeId: string }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "IMMUTABLE"
        | "INVALID_INPUT"
        | "INACTIVE_CAPABILITY";
      message: string;
    };

async function requireEditableScope(scopeId: string) {
  const scope = await prisma.commercialScope.findUnique({
    where: { id: scopeId },
  });
  if (!scope) {
    return { ok: false as const, code: "NOT_FOUND" as const, message: "Scope not found." };
  }
  if (scope.status === "APPROVED" || scope.status === "SUPERSEDED") {
    return {
      ok: false as const,
      code: "IMMUTABLE" as const,
      message:
        "Approved and superseded Scopes are immutable. Use Revise to create a new draft.",
    };
  }
  return { ok: true as const, scope };
}

export async function updateScopeHeader(options: {
  scopeId: string;
  title?: string;
  summary?: string | null;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const title = options.title?.trim().slice(0, MAX_SCOPE_TITLE_CHARS);
  const summary =
    options.summary === undefined
      ? undefined
      : options.summary?.trim().slice(0, MAX_SCOPE_SUMMARY_CHARS) || null;

  await prisma.commercialScope.update({
    where: { id: options.scopeId },
    data: {
      ...(title ? { title } : {}),
      ...(summary !== undefined ? { summary } : {}),
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function markScopeReviewed(options: {
  scopeId: string;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.scope.status === "REVIEWED") {
    return { ok: true, scopeId: options.scopeId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialScope.update({
      where: { id: options.scopeId },
      data: { status: "REVIEWED" },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.scope.opportunityId,
        type: "SCOPE_REVIEWED",
        actorEmail: options.actorEmail,
        toValueJson: { scopeId: options.scopeId } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function approveCommercialScope(options: {
  scopeId: string;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const scope = await prisma.commercialScope.findUnique({
    where: { id: options.scopeId },
    include: {
      sections: {
        where: { isIncluded: true },
        include: {
          deliverables: { where: { isIncluded: true } },
        },
      },
    },
  });

  if (!scope) {
    return { ok: false, code: "NOT_FOUND", message: "Scope not found." };
  }

  if (scope.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "IMMUTABLE",
      message: "Cannot approve a superseded Scope.",
    };
  }

  if (scope.status === "APPROVED") {
    return { ok: true, scopeId: options.scopeId };
  }

  const includedSections = scope.sections.filter((s) => s.isIncluded);
  if (includedSections.length === 0) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Include at least one section before approving.",
    };
  }

  const hasDeliverable = includedSections.some((s) =>
    s.deliverables.some((d) => d.isIncluded),
  );
  if (!hasDeliverable) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Include at least one deliverable before approving.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialScope.update({
      where: { id: options.scopeId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: scope.opportunityId,
        type: "SCOPE_APPROVED",
        actorEmail: options.actorEmail,
        toValueJson: {
          scopeId: options.scopeId,
          revision: scope.revision,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function updateScopeSection(options: {
  scopeId: string;
  sectionId: string;
  title?: string;
  description?: string | null;
  isIncluded?: boolean;
  isOptional?: boolean;
  capabilities?: ServiceCapabilityId[];
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const section = await prisma.commercialScopeSection.findFirst({
    where: { id: options.sectionId, scopeId: options.scopeId },
  });
  if (!section) {
    return { ok: false, code: "NOT_FOUND", message: "Section not found." };
  }

  if (options.capabilities) {
    for (const id of options.capabilities) {
      const meta = getServiceCapability(id);
      if (!meta?.active) {
        return {
          ok: false,
          code: "INACTIVE_CAPABILITY",
          message: `Inactive capability cannot be added: ${id}`,
        };
      }
    }
  }

  await prisma.commercialScopeSection.update({
    where: { id: options.sectionId },
    data: {
      ...(options.title !== undefined
        ? { title: options.title.trim().slice(0, MAX_SECTION_TITLE_CHARS) }
        : {}),
      ...(options.description !== undefined
        ? {
            description:
              options.description?.trim().slice(0, MAX_SECTION_DESCRIPTION_CHARS) ||
              null,
          }
        : {}),
      ...(options.isIncluded !== undefined
        ? { isIncluded: options.isIncluded }
        : {}),
      ...(options.isOptional !== undefined
        ? { isOptional: options.isOptional }
        : {}),
      ...(options.capabilities
        ? {
            capabilitiesJson:
              options.capabilities as unknown as Prisma.InputJsonValue,
          }
        : {}),
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function reorderScopeSections(options: {
  scopeId: string;
  orderedSectionIds: string[];
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  await prisma.$transaction(
    options.orderedSectionIds.map((id, index) =>
      prisma.commercialScopeSection.updateMany({
        where: { id, scopeId: options.scopeId },
        data: { sortOrder: index },
      }),
    ),
  );

  return { ok: true, scopeId: options.scopeId };
}

export async function updateScopeDeliverable(options: {
  scopeId: string;
  deliverableId: string;
  title?: string;
  description?: string | null;
  isIncluded?: boolean;
  isOptional?: boolean;
  deliverableType?: ScopeDeliverableType;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const deliverable = await prisma.commercialScopeDeliverable.findFirst({
    where: {
      id: options.deliverableId,
      section: { scopeId: options.scopeId },
    },
  });
  if (!deliverable) {
    return { ok: false, code: "NOT_FOUND", message: "Deliverable not found." };
  }

  await prisma.commercialScopeDeliverable.update({
    where: { id: options.deliverableId },
    data: {
      ...(options.title !== undefined
        ? {
            title: options.title.trim().slice(0, MAX_DELIVERABLE_TITLE_CHARS),
          }
        : {}),
      ...(options.description !== undefined
        ? {
            description:
              options.description
                ?.trim()
                .slice(0, MAX_DELIVERABLE_DESCRIPTION_CHARS) || null,
          }
        : {}),
      ...(options.isIncluded !== undefined
        ? { isIncluded: options.isIncluded }
        : {}),
      ...(options.isOptional !== undefined
        ? { isOptional: options.isOptional }
        : {}),
      ...(options.deliverableType
        ? { deliverableType: options.deliverableType }
        : {}),
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function addManualDeliverable(options: {
  scopeId: string;
  sectionId: string;
  title: string;
  description?: string | null;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const section = await prisma.commercialScopeSection.findFirst({
    where: { id: options.sectionId, scopeId: options.scopeId },
    include: { deliverables: { select: { sortOrder: true } } },
  });
  if (!section) {
    return { ok: false, code: "NOT_FOUND", message: "Section not found." };
  }

  const title = options.title.trim().slice(0, MAX_DELIVERABLE_TITLE_CHARS);
  if (!title) {
    return { ok: false, code: "INVALID_INPUT", message: "Title is required." };
  }

  const nextOrder =
    section.deliverables.reduce((max, d) => Math.max(max, d.sortOrder), -1) + 1;

  await prisma.commercialScopeDeliverable.create({
    data: {
      sectionId: options.sectionId,
      sourceActionKey: null,
      title,
      description:
        options.description?.trim().slice(0, MAX_DELIVERABLE_DESCRIPTION_CHARS) ||
        null,
      deliverableType: "OTHER",
      sortOrder: nextOrder,
      isOptional: false,
      isIncluded: true,
      source: "MANUAL",
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function removeManualDeliverable(options: {
  scopeId: string;
  deliverableId: string;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const deliverable = await prisma.commercialScopeDeliverable.findFirst({
    where: {
      id: options.deliverableId,
      section: { scopeId: options.scopeId },
    },
  });
  if (!deliverable) {
    return { ok: false, code: "NOT_FOUND", message: "Deliverable not found." };
  }
  if (deliverable.source !== "MANUAL") {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Only manual deliverables can be removed. Exclude plan-derived ones instead.",
    };
  }

  await prisma.commercialScopeDeliverable.delete({
    where: { id: options.deliverableId },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function reorderScopeDeliverables(options: {
  scopeId: string;
  sectionId: string;
  orderedDeliverableIds: string[];
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  await prisma.$transaction(
    options.orderedDeliverableIds.map((id, index) =>
      prisma.commercialScopeDeliverable.updateMany({
        where: { id, sectionId: options.sectionId },
        data: { sortOrder: index },
      }),
    ),
  );

  return { ok: true, scopeId: options.scopeId };
}

export async function replaceScopeAssumptions(options: {
  scopeId: string;
  assumptions: Array<{ text: string; templateKey?: string | null }>;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const assumptions: ScopeAssumption[] = options.assumptions
    .slice(0, MAX_ASSUMPTIONS)
    .map((row, index) => ({
      id: randomUUID(),
      text: row.text.trim().slice(0, MAX_ASSUMPTION_CHARS),
      sortOrder: index,
      templateKey: row.templateKey ?? null,
    }))
    .filter((row) => row.text.length > 0);

  await prisma.commercialScope.update({
    where: { id: options.scopeId },
    data: {
      assumptionsJson: assumptions as unknown as Prisma.InputJsonValue,
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export async function replaceScopeExclusions(options: {
  scopeId: string;
  exclusions: Array<{ text: string; templateKey?: string | null }>;
  actorEmail: string;
}): Promise<ScopeMutationResult> {
  const gate = await requireEditableScope(options.scopeId);
  if (!gate.ok) {
    return gate;
  }

  const exclusions: ScopeExclusion[] = options.exclusions
    .slice(0, MAX_EXCLUSIONS)
    .map((row, index) => ({
      id: randomUUID(),
      text: row.text.trim().slice(0, MAX_EXCLUSION_CHARS),
      sortOrder: index,
      templateKey: row.templateKey ?? null,
    }))
    .filter((row) => row.text.length > 0);

  await prisma.commercialScope.update({
    where: { id: options.scopeId },
    data: {
      exclusionsJson: exclusions as unknown as Prisma.InputJsonValue,
    },
  });

  return { ok: true, scopeId: options.scopeId };
}

export function listAssignableScopeCapabilities(): ServiceCapabilityId[] {
  return listActiveServiceCapabilities().map((c) => c.id);
}

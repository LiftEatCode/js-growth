import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { ACTIVE_OPPORTUNITY_STAGES } from "@/lib/commercialization/opportunities/constants";
import { prisma } from "@/lib/prisma";

import { buildScopeFromPlan } from "./build";
import { COMMERCIAL_SCOPE_VERSION } from "./constants";

export type CreateScopeResult =
  | { ok: true; scopeId: string; revision: number; revised: boolean }
  | {
      ok: false;
      code:
        | "MISSING_OPPORTUNITY"
        | "TERMINAL_OPPORTUNITY"
        | "HAS_ACTIVE_DRAFT"
        | "INVALID_INPUT";
      message: string;
      existingScopeId?: string;
    };

async function persistBuiltScope(options: {
  opportunityId: string;
  revision: number;
  createdByEmail: string;
  built: ReturnType<typeof buildScopeFromPlan>;
  activityType: "SCOPE_CREATED" | "SCOPE_REVISED";
  supersedePrior: boolean;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    if (options.supersedePrior) {
      await tx.commercialScope.updateMany({
        where: {
          opportunityId: options.opportunityId,
          status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
        },
        data: {
          status: "SUPERSEDED",
          supersededAt: new Date(),
        },
      });

      await tx.opportunityActivity.create({
        data: {
          opportunityId: options.opportunityId,
          type: "SCOPE_SUPERSEDED",
          actorEmail: options.createdByEmail,
          toValueJson: {
            reason: "revised",
          } as Prisma.InputJsonValue,
        },
      });
    }

    const scope = await tx.commercialScope.create({
      data: {
        opportunityId: options.opportunityId,
        implementationPlanId: options.built.implementationPlanId,
        implementationInterpretationId:
          options.built.implementationInterpretationId,
        status: "DRAFT",
        revision: options.revision,
        title: options.built.title,
        summary: options.built.summary,
        scopeVersion: COMMERCIAL_SCOPE_VERSION,
        sourceFingerprint: options.built.sourceFingerprint,
        assumptionsJson: options.built.assumptions as unknown as Prisma.InputJsonValue,
        exclusionsJson: options.built.exclusions as unknown as Prisma.InputJsonValue,
        considerationsJson:
          options.built.considerations as unknown as Prisma.InputJsonValue,
        createdByEmail: options.createdByEmail,
        sections: {
          create: options.built.sections.map((section) => ({
            sourceImplementationWorkstreamId:
              section.sourceImplementationWorkstreamId,
            workstreamType: section.workstreamType,
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder,
            isOptional: section.isOptional,
            isIncluded: section.isIncluded,
            capabilitiesJson:
              section.capabilities as unknown as Prisma.InputJsonValue,
            source: section.source,
            deliverables: {
              create: section.deliverables.map((deliverable) => ({
                sourceActionKey: deliverable.sourceActionKey,
                title: deliverable.title,
                description: deliverable.description,
                deliverableType: deliverable.deliverableType,
                sortOrder: deliverable.sortOrder,
                isOptional: deliverable.isOptional,
                isIncluded: deliverable.isIncluded,
                source: deliverable.source,
              })),
            },
          })),
        },
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: options.activityType,
        actorEmail: options.createdByEmail,
        toValueJson: {
          scopeId: scope.id,
          revision: options.revision,
          implementationPlanId: options.built.implementationPlanId,
          sectionCount: options.built.sections.length,
        } as Prisma.InputJsonValue,
      },
    });

    return scope.id;
  });
}

export async function createCommercialScope(options: {
  opportunityId: string;
  createdByEmail: string;
}): Promise<CreateScopeResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    include: {
      prospect: { select: { businessName: true } },
    },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "MISSING_OPPORTUNITY",
      message: "Opportunity not found.",
    };
  }

  if (
    !(ACTIVE_OPPORTUNITY_STAGES as readonly string[]).includes(
      opportunity.stage,
    )
  ) {
    return {
      ok: false,
      code: "TERMINAL_OPPORTUNITY",
      message:
        "Reopen the Opportunity before creating a Scope on a WON or LOST record.",
    };
  }

  const existingCurrent = await prisma.commercialScope.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingCurrent) {
    return {
      ok: false,
      code: "HAS_ACTIVE_DRAFT",
      message:
        "A current Scope already exists. Open it or use Revise to create a new version.",
      existingScopeId: existingCurrent.id,
    };
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: opportunity.campaignId,
    prospectId: opportunity.prospectId,
  });

  const built = buildScopeFromPlan({
    opportunityId: opportunity.id,
    businessName: opportunity.prospect.businessName,
    plan: planLoad.plan,
    interpretationId: opportunity.implementationInterpretationId,
  });

  const scopeId = await persistBuiltScope({
    opportunityId: opportunity.id,
    revision: 1,
    createdByEmail: options.createdByEmail,
    built,
    activityType: "SCOPE_CREATED",
    supersedePrior: false,
  });

  return { ok: true, scopeId, revision: 1, revised: false };
}

export async function reviseCommercialScope(options: {
  opportunityId: string;
  createdByEmail: string;
  fromLatestPlan?: boolean;
}): Promise<CreateScopeResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    include: {
      prospect: { select: { businessName: true } },
    },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "MISSING_OPPORTUNITY",
      message: "Opportunity not found.",
    };
  }

  if (
    !(ACTIVE_OPPORTUNITY_STAGES as readonly string[]).includes(
      opportunity.stage,
    )
  ) {
    return {
      ok: false,
      code: "TERMINAL_OPPORTUNITY",
      message: "Reopen the Opportunity before revising Scope.",
    };
  }

  const latest = await prisma.commercialScope.findFirst({
    where: { opportunityId: options.opportunityId },
    orderBy: { revision: "desc" },
  });

  const nextRevision = (latest?.revision ?? 0) + 1;

  const planLoad = await loadLatestImplementationPlan({
    campaignId: opportunity.campaignId,
    prospectId: opportunity.prospectId,
  });

  // Prefer regenerating from current plan (default). Cloning approved text can be a later enhancement.
  const built = buildScopeFromPlan({
    opportunityId: opportunity.id,
    businessName: opportunity.prospect.businessName,
    plan: options.fromLatestPlan === false ? null : planLoad.plan,
    interpretationId: opportunity.implementationInterpretationId,
  });

  const scopeId = await persistBuiltScope({
    opportunityId: opportunity.id,
    revision: nextRevision,
    createdByEmail: options.createdByEmail,
    built,
    activityType: "SCOPE_REVISED",
    supersedePrior: true,
  });

  return { ok: true, scopeId, revision: nextRevision, revised: true };
}

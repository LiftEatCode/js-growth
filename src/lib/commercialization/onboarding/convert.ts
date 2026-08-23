import type { Prisma } from "@/generated/prisma/client";
import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import { getOnboardingEligibility } from "./eligibility";
import { buildOnboardingChecklistTemplate } from "./checklist";
import {
  collectSnapshotCapabilities,
  mapScopeSnapshotToDelivery,
} from "./map-delivery";
import { buildProjectCommercialSnapshot } from "./snapshot";
import {
  normalizeHostname,
  resolveInitialClientContact,
} from "./identity";
import type { OnboardingEligibilityResult } from "./types";
import { loadPaymentsForAgreement } from "@/lib/commercialization/payments/load";
import { loadCommercialScopeDetail } from "@/lib/commercialization/scope/load";
import { prisma } from "@/lib/prisma";

import { CLIENT_PROJECT_ONBOARDING_VERSION } from "./constants";
import type { AcceptedAgreementPaymentAuthority } from "@/lib/commercialization/payments/types";

export type ConvertToClientResult =
  | {
      ok: true;
      created: boolean;
      clientId: string;
      projectId: string;
      opportunityId: string;
      eligibility: Extract<OnboardingEligibilityResult, { eligible: true }>;
    }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "NOT_ELIGIBLE"
        | "AMBIGUOUS_CLIENT"
        | "MISSING_SOURCES"
        | "SCOPE_MISSING";
      message: string;
      eligibility?: OnboardingEligibilityResult;
      candidateClientIds?: string[];
    };

/**
 * Explicit human conversion: eligibility → WON → Client → Project → checklist.
 * Idempotent: re-running returns the same Client + Project.
 */
export async function convertOpportunityToClientProject(options: {
  opportunityId: string;
  actorEmail: string;
  /** When hostname matches multiple Clients, operator must pick one. */
  selectedClientId?: string;
}): Promise<ConvertToClientResult> {
  const existingProject = await prisma.clientProject.findUnique({
    where: { opportunityId: options.opportunityId },
    select: { id: true, clientId: true, opportunityId: true },
  });

  if (existingProject) {
    const paymentLoad = await loadPaymentAuthorityForOpportunity(
      options.opportunityId,
    );
    const eligibility = getOnboardingEligibility({
      agreement: paymentLoad.agreement,
      payments: paymentLoad.payments,
    });
    return {
      ok: true,
      created: false,
      clientId: existingProject.clientId,
      projectId: existingProject.id,
      opportunityId: existingProject.opportunityId,
      eligibility: eligibility.eligible
        ? eligibility
        : {
            ok: true,
            eligible: true,
            paymentState: "DEPOSIT_PAID_BALANCE_PENDING",
            depositPaid: true,
            balanceOutstandingCents: 0,
            paidInFull: false,
            reason: "Existing project — conversion already completed.",
          },
    };
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    include: {
      prospect: {
        include: {
          contacts: { orderBy: { createdAt: "asc" }, take: 5 },
          client: true,
        },
      },
      client: true,
    },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Opportunity not found.",
    };
  }

  const agreement = await prisma.commercialAgreement.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: "ACCEPTED",
    },
    orderBy: { acceptedAt: "desc" },
    include: {
      acceptance: true,
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      proposal: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!agreement) {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message: "An accepted Agreement is required before conversion.",
      eligibility: getOnboardingEligibility({
        agreement: null,
        payments: [],
      }),
    };
  }

  const payments = await loadPaymentsForAgreement({
    agreementId: agreement.id,
  });

  const authority: AcceptedAgreementPaymentAuthority = {
    agreementId: agreement.id,
    opportunityId: agreement.opportunityId,
    status: agreement.status,
    currency: agreement.currency,
    paymentTermType: agreement.paymentTermType as AgreementPaymentTermType,
    totalInvestmentCents: agreement.totalInvestmentCents,
    depositCents: agreement.depositCents,
    balanceCents: agreement.balanceCents,
    paymentCustomText: agreement.paymentCustomText,
    businessName: opportunity.prospect.businessName,
  };

  const eligibility = getOnboardingEligibility({
    agreement: authority,
    payments,
  });

  if (!eligibility.eligible) {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message: eligibility.reason,
      eligibility,
    };
  }

  const scopeDetail = await loadCommercialScopeDetail({
    scopeId: agreement.commercialScopeId,
  });
  if (!scopeDetail) {
    return {
      ok: false,
      code: "SCOPE_MISSING",
      message: "Accepted Agreement Scope could not be loaded.",
    };
  }

  const contact = resolveInitialClientContact({
    signerName: agreement.acceptance?.signerName ?? null,
    signerEmail: agreement.acceptance?.signerEmail ?? null,
    deliveryRecipientName: agreement.deliveries[0]?.recipientName ?? null,
    deliveryRecipientEmail: agreement.deliveries[0]?.recipientEmail ?? null,
    prospectContactName: opportunity.prospect.contacts[0]?.name ?? null,
    prospectContactEmail: opportunity.prospect.contacts[0]?.email ?? null,
  });

  const hostname = normalizeHostname(
    opportunity.prospect.hostname ?? opportunity.prospect.website,
  );

  const clientResolution = await resolveClientForConversion({
    opportunityId: opportunity.id,
    prospectId: opportunity.prospectId,
    existingOpportunityClientId: opportunity.clientId,
    prospectClientId: opportunity.prospect.client?.id ?? null,
    hostname,
    selectedClientId: options.selectedClientId,
  });

  if (!clientResolution.ok) {
    return clientResolution;
  }

  const snapshot = buildProjectCommercialSnapshot({
    businessName: opportunity.prospect.businessName,
    agreement: {
      id: agreement.id,
      revision: agreement.revision,
      agreementVersion: agreement.agreementVersion,
      currency: agreement.currency,
      totalInvestmentCents: agreement.totalInvestmentCents,
      depositCents: agreement.depositCents,
      balanceCents: agreement.balanceCents,
      depositPercent: agreement.depositPercent,
      paymentTermType: agreement.paymentTermType as AgreementPaymentTermType,
      paymentCustomText: agreement.paymentCustomText,
      clientResponsibilitiesJson: agreement.clientResponsibilitiesJson,
      jsResponsibilitiesJson: agreement.jsResponsibilitiesJson,
    },
    scope: scopeDetail,
    pricingId: agreement.commercialPricingId,
    pricingRevision: agreement.commercialPricing.revision,
    proposalId: agreement.proposalId,
    proposalRevision: agreement.proposal.revision,
    depositPaid: eligibility.depositPaid,
    balanceOutstandingCents: eligibility.balanceOutstandingCents,
  });

  const mapped = mapScopeSnapshotToDelivery(snapshot);
  const capabilities = collectSnapshotCapabilities(snapshot);
  const checklist = buildOnboardingChecklistTemplate({ capabilities });

  const projectName = `${opportunity.prospect.businessName} — Website Growth Implementation`;

  const result = await prisma.$transaction(async (tx) => {
    // Re-check idempotency inside transaction
    const raced = await tx.clientProject.findUnique({
      where: { opportunityId: options.opportunityId },
      select: { id: true, clientId: true },
    });
    if (raced) {
      return {
        created: false as const,
        clientId: raced.clientId,
        projectId: raced.id,
      };
    }

    let clientId = clientResolution.clientId;
    let clientCreated = false;

    if (!clientId) {
      const createdClient = await tx.client.create({
        data: {
          name: opportunity.prospect.businessName,
          primaryContactName: contact.name,
          primaryContactEmail: contact.email,
          phone: opportunity.prospect.phone,
          website: opportunity.prospect.website,
          hostname,
          city: opportunity.prospect.city,
          state: opportunity.prospect.state,
          sourceProspectId: opportunity.prospectId,
          sourceOpportunityId: opportunity.id,
          status: "ACTIVE",
          createdByEmail: options.actorEmail,
        },
      });
      clientId = createdClient.id;
      clientCreated = true;
    } else {
      // Link source ids if missing; never overwrite corrected contact fields.
      await tx.client.update({
        where: { id: clientId },
        data: {
          sourceProspectId:
            (
              await tx.client.findUnique({
                where: { id: clientId },
                select: { sourceProspectId: true },
              })
            )?.sourceProspectId ?? opportunity.prospectId,
          sourceOpportunityId:
            (
              await tx.client.findUnique({
                where: { id: clientId },
                select: { sourceOpportunityId: true },
              })
            )?.sourceOpportunityId ?? opportunity.id,
        },
      });
    }

    const project = await tx.clientProject.create({
      data: {
        clientId,
        opportunityId: opportunity.id,
        agreementId: agreement.id,
        scopeId: agreement.commercialScopeId,
        pricingId: agreement.commercialPricingId,
        proposalId: agreement.proposalId,
        name: projectName,
        status: "ONBOARDING",
        ownerEmail: opportunity.ownerEmail,
        commercialSnapshotJson: snapshot as unknown as Prisma.InputJsonValue,
        onboardingVersion: CLIENT_PROJECT_ONBOARDING_VERSION,
        createdByEmail: options.actorEmail,
      },
    });

    const workstreamIdBySection = new Map<string, string>();
    for (const ws of mapped.workstreams) {
      const row = await tx.projectWorkstream.create({
        data: {
          projectId: project.id,
          sourceScopeSectionId: ws.sourceScopeSectionId,
          title: ws.title,
          capabilitiesJson: ws.capabilities as unknown as Prisma.InputJsonValue,
          sortOrder: ws.sortOrder,
          status: "NOT_STARTED",
        },
      });
      workstreamIdBySection.set(ws.sourceScopeSectionId, row.id);
    }

    const taskIdByKey = new Map<string, string>();
    for (const task of mapped.deliveryTasks) {
      const row = await tx.projectDeliveryTask.create({
        data: {
          projectId: project.id,
          key: task.key,
          title: task.title,
          description: task.description,
          status: "NOT_STARTED",
          sourceScopeDeliverableIdsJson:
            task.sourceScopeDeliverableIds as unknown as Prisma.InputJsonValue,
          sourceWorkstreamIdsJson:
            task.sourceWorkstreamIds as unknown as Prisma.InputJsonValue,
          capabilitiesJson:
            task.capabilities as unknown as Prisma.InputJsonValue,
        },
      });
      taskIdByKey.set(task.key, row.id);
    }

    for (const ws of mapped.workstreams) {
      const workstreamId = workstreamIdBySection.get(ws.sourceScopeSectionId)!;
      for (const d of ws.deliverables) {
        await tx.projectDeliverable.create({
          data: {
            projectId: project.id,
            workstreamId,
            deliveryTaskId: taskIdByKey.get(d.deliveryTaskKey) ?? null,
            sourceScopeDeliverableId: d.sourceScopeDeliverableId,
            sourceActionKey: d.sourceActionKey,
            title: d.title,
            description: d.description,
            sortOrder: d.sortOrder,
            status: "NOT_STARTED",
          },
        });
      }
    }

    for (const item of checklist) {
      const autoStatus =
        item.key === "AGREEMENT_ACCEPTED" ||
        item.key === "INITIAL_PAYMENT_CONFIRMED"
          ? ("COMPLETED" as const)
          : ("NOT_STARTED" as const);
      await tx.projectOnboardingItem.create({
        data: {
          projectId: project.id,
          key: item.key,
          label: item.label,
          description: item.description,
          status: autoStatus,
          required: item.required,
          sortOrder: item.sortOrder,
          completedAt: autoStatus === "COMPLETED" ? new Date() : null,
        },
      });
    }

    await tx.opportunity.update({
      where: { id: opportunity.id },
      data: {
        stage: "WON",
        wonAt: opportunity.wonAt ?? new Date(),
        lostAt: null,
        lostReason: null,
        lostNote: null,
        clientId,
      },
    });

    if (clientCreated) {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: opportunity.id,
          type: "CLIENT_CREATED",
          actorEmail: options.actorEmail,
          toValueJson: { clientId } as Prisma.InputJsonValue,
        },
      });
    }

    await tx.opportunityActivity.create({
      data: {
        opportunityId: opportunity.id,
        type: "PROJECT_CREATED",
        actorEmail: options.actorEmail,
        toValueJson: {
          projectId: project.id,
          clientId,
        } as Prisma.InputJsonValue,
      },
    });

    if (opportunity.stage !== "WON") {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: opportunity.id,
          type: "MARKED_WON",
          actorEmail: options.actorEmail,
          fromValueJson: {
            stage: opportunity.stage,
          } as Prisma.InputJsonValue,
          toValueJson: { stage: "WON" } as Prisma.InputJsonValue,
          note: "Converted to Client / Project onboarding",
        },
      });
    }

    await tx.opportunityActivity.create({
      data: {
        opportunityId: opportunity.id,
        type: "ONBOARDING_STARTED",
        actorEmail: options.actorEmail,
        toValueJson: { projectId: project.id } as Prisma.InputJsonValue,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        type: "PROJECT_CREATED",
        actorEmail: options.actorEmail,
        toValueJson: {
          status: "ONBOARDING",
          agreementId: agreement.id,
        } as Prisma.InputJsonValue,
      },
    });

    await tx.projectActivity.create({
      data: {
        projectId: project.id,
        type: "ONBOARDING_STARTED",
        actorEmail: options.actorEmail,
      },
    });

    return {
      created: true as const,
      clientId,
      projectId: project.id,
    };
  });

  return {
    ok: true,
    created: result.created,
    clientId: result.clientId,
    projectId: result.projectId,
    opportunityId: options.opportunityId,
    eligibility,
  };
}

async function loadPaymentAuthorityForOpportunity(opportunityId: string) {
  const { loadPaymentStateForOpportunity } = await import(
    "@/lib/commercialization/payments/load"
  );
  return loadPaymentStateForOpportunity({ opportunityId });
}

async function resolveClientForConversion(options: {
  opportunityId: string;
  prospectId: string;
  existingOpportunityClientId: string | null;
  prospectClientId: string | null;
  hostname: string | null;
  selectedClientId?: string;
}): Promise<
  | { ok: true; clientId: string | null }
  | Extract<ConvertToClientResult, { ok: false }>
> {
  if (options.selectedClientId) {
    const selected = await prisma.client.findUnique({
      where: { id: options.selectedClientId },
      select: { id: true },
    });
    if (!selected) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "Selected Client was not found.",
      };
    }
    return { ok: true, clientId: selected.id };
  }

  if (options.existingOpportunityClientId) {
    return { ok: true, clientId: options.existingOpportunityClientId };
  }

  if (options.prospectClientId) {
    return { ok: true, clientId: options.prospectClientId };
  }

  const bySourceOpp = await prisma.client.findUnique({
    where: { sourceOpportunityId: options.opportunityId },
    select: { id: true },
  });
  if (bySourceOpp) {
    return { ok: true, clientId: bySourceOpp.id };
  }

  const bySourceProspect = await prisma.client.findUnique({
    where: { sourceProspectId: options.prospectId },
    select: { id: true },
  });
  if (bySourceProspect) {
    return { ok: true, clientId: bySourceProspect.id };
  }

  if (options.hostname) {
    const matches = await prisma.client.findMany({
      where: { hostname: options.hostname, status: "ACTIVE" },
      select: { id: true, name: true },
      take: 5,
    });
    if (matches.length === 1) {
      return { ok: true, clientId: matches[0]!.id };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        code: "AMBIGUOUS_CLIENT",
        message:
          "Multiple Clients match this website hostname. Select which Client to reuse.",
        candidateClientIds: matches.map((m) => m.id),
      };
    }
  }

  return { ok: true, clientId: null };
}

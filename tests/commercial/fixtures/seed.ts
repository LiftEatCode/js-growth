import { createHash, randomBytes } from "node:crypto";

import type { PrismaClient } from "@/generated/prisma/client";
import { buildAgreementFromApprovedSources } from "@/lib/commercialization/agreement/build";
import {
  COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
  COMMERCIAL_AGREEMENT_TERMS_VERSION,
  COMMERCIAL_AGREEMENT_VERSION,
} from "@/lib/commercialization/agreement/constants";
import { buildAgreementSourceFingerprint } from "@/lib/commercialization/agreement/fingerprint";
import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "@/lib/commercialization/pricing/constants";
import { buildPricingSourceFingerprint } from "@/lib/commercialization/pricing/fingerprint";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "@/lib/commercialization/proposal/constants";
import { buildProposalSourceFingerprint } from "@/lib/commercialization/proposal/fingerprint";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";
import {
  COMMERCIAL_SCOPE_MAPPING_VERSION,
  COMMERCIAL_SCOPE_VERSION,
} from "@/lib/commercialization/scope/constants";
import { buildScopeSourceFingerprint } from "@/lib/commercialization/scope/fingerprint";

export const COMMERCIAL_E2E_ACTOR = "e2e-commercial@js-solutions.test";
export const COMMERCIAL_E2E_PREFIX = "E2E Commercial";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function makeToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface SeededCommercialPipeline {
  runId: string;
  businessName: string;
  campaignId: string;
  prospectId: string;
  opportunityId: string;
  scopeId: string;
  pricingId: string;
  proposalId: string;
  proposalShareToken: string;
  proposalDeliveryId: string;
  agreementId: string;
  agreementShareToken: string;
  agreementDeliveryId: string;
  totalInvestmentCents: number;
  depositCents: number;
  balanceCents: number;
}

export async function cleanupCommercialE2eFixtures(
  prisma: PrismaClient,
  runId?: string,
): Promise<void> {
  const where = runId
    ? { businessName: { contains: runId } }
    : { businessName: { startsWith: COMMERCIAL_E2E_PREFIX } };

  const prospects = await prisma.prospect.findMany({
    where,
    select: { id: true },
  });
  const prospectIds = prospects.map((p) => p.id);
  if (prospectIds.length === 0) {
    return;
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { prospectId: { in: prospectIds } },
    select: { id: true, campaignId: true },
  });
  const opportunityIds = opportunities.map((o) => o.id);
  const campaignIds = [...new Set(opportunities.map((o) => o.campaignId))];

  if (opportunityIds.length > 0) {
    await prisma.clientProject.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.commercialPayment.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.agreementAcceptance.deleteMany({
      where: { agreement: { opportunityId: { in: opportunityIds } } },
    });
    await prisma.agreementDelivery.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.commercialAgreement.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.proposalDelivery.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.commercialProposal.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.commercialPricingLineItem.deleteMany({
      where: { pricing: { opportunityId: { in: opportunityIds } } },
    });
    await prisma.commercialPricing.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.commercialScopeDeliverable.deleteMany({
      where: {
        section: { scope: { opportunityId: { in: opportunityIds } } },
      },
    });
    await prisma.commercialScopeSection.deleteMany({
      where: { scope: { opportunityId: { in: opportunityIds } } },
    });
    await prisma.commercialScope.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.opportunityActivity.deleteMany({
      where: { opportunityId: { in: opportunityIds } },
    });
    await prisma.opportunity.updateMany({
      where: { id: { in: opportunityIds } },
      data: { clientId: null },
    });
    await prisma.client.deleteMany({
      where: {
        OR: [
          { sourceOpportunityId: { in: opportunityIds } },
          { sourceProspectId: { in: prospectIds } },
        ],
      },
    });
    await prisma.opportunity.deleteMany({
      where: { id: { in: opportunityIds } },
    });
  }

  await prisma.campaignProspect.deleteMany({
    where: { prospectId: { in: prospectIds } },
  });
  await prisma.prospect.deleteMany({ where: { id: { in: prospectIds } } });
  if (campaignIds.length > 0) {
    await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  }
}

/**
 * Seeds a full approved commercial pipeline ready for agreement acceptance E2E.
 * Uses direct Prisma writes (deterministic, no external APIs).
 */
export async function seedApprovedCommercialPipeline(
  prisma: PrismaClient,
  options?: {
    withAcceptedProposalIntent?: boolean;
    /** Override included/total investment (integer USD cents). Default 300_000. */
    totalInvestmentCents?: number;
    /** Inserted into businessName after the E2E prefix for fixture identification. */
    businessLabel?: string;
    paymentTermType?: "FULL_UPFRONT" | "DEPOSIT_AND_BALANCE";
  },
): Promise<SeededCommercialPipeline> {
  const runId = `${Date.now()}-${randomBytes(3).toString("hex")}`;
  const businessName = options?.businessLabel
    ? `${COMMERCIAL_E2E_PREFIX} ${options.businessLabel} ${runId}`
    : `${COMMERCIAL_E2E_PREFIX} ${runId}`;
  const withAccepted =
    options?.withAcceptedProposalIntent !== false;
  const includedCents = options?.totalInvestmentCents ?? 300_000;
  const paymentTermType = options?.paymentTermType ?? "DEPOSIT_AND_BALANCE";

  const campaign = await prisma.campaign.create({
    data: {
      name: `Campaign ${runId}`,
      locationLabel: "Austin, TX",
      city: "Austin",
      state: "TX",
      createdByEmail: COMMERCIAL_E2E_ACTOR,
    },
  });

  const prospect = await prisma.prospect.create({
    data: {
      businessName,
      city: "Austin",
      state: "TX",
      website: "https://example-e2e.test",
      hostname: "example-e2e.test",
    },
  });

  await prisma.campaignProspect.create({
    data: {
      campaignId: campaign.id,
      prospectId: prospect.id,
    },
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      prospectId: prospect.id,
      campaignId: campaign.id,
      name: `Opportunity ${runId}`,
      ownerEmail: COMMERCIAL_E2E_ACTOR,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
      recommendedCapabilitiesJson: {
        capabilityVersion: 1,
        sourcePlanId: null,
        sourcePlanStatus: null,
        snapshottedAt: new Date().toISOString(),
        capabilities: [],
        noPlanAtSnapshot: true,
      },
    },
  });

  const scopeFingerprint = buildScopeSourceFingerprint({
    opportunityId: opportunity.id,
    implementationPlanId: null,
    planVersion: null,
    mappingVersion: null,
    scopeVersion: COMMERCIAL_SCOPE_VERSION,
    scopeMappingVersion: COMMERCIAL_SCOPE_MAPPING_VERSION,
  });

  const scope = await prisma.commercialScope.create({
    data: {
      opportunityId: opportunity.id,
      status: "APPROVED",
      revision: 1,
      title: "Website Growth Scope",
      summary: "E2E approved scope",
      scopeVersion: COMMERCIAL_SCOPE_VERSION,
      sourceFingerprint: scopeFingerprint,
      assumptionsJson: [{ id: "a1", text: "Client provides CMS access.", sortOrder: 0 }],
      exclusionsJson: [{ id: "e1", text: "Paid advertising not included.", sortOrder: 0 }],
      considerationsJson: [
        { id: "c1", text: "Legacy theme may limit layout changes.", key: "legacy" },
      ],
      approvedAt: new Date(),
      approvedByEmail: COMMERCIAL_E2E_ACTOR,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
      sections: {
        create: [
          {
            title: "Search Optimization",
            sortOrder: 0,
            isIncluded: true,
            isOptional: false,
            capabilitiesJson: [],
            source: "MANUAL",
            deliverables: {
              create: [
                {
                  title: "Heading architecture improvements",
                  sourceActionKey: "heading-architecture",
                  sortOrder: 0,
                  isIncluded: true,
                  isOptional: false,
                  source: "MANUAL",
                },
              ],
            },
          },
          {
            title: "Content Foundation",
            sortOrder: 1,
            isIncluded: true,
            isOptional: false,
            capabilitiesJson: [],
            source: "MANUAL",
            deliverables: {
              create: [
                {
                  title: "Heading structure for service pages",
                  sourceActionKey: "heading-architecture",
                  sortOrder: 0,
                  isIncluded: true,
                  isOptional: false,
                  source: "MANUAL",
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      sections: { include: { deliverables: true } },
    },
  });

  const deliverableIds = scope.sections.flatMap((s) =>
    s.deliverables.map((d) => d.id),
  );

  const pricingFingerprint = buildPricingSourceFingerprint({
    opportunityId: opportunity.id,
    commercialScopeId: scope.id,
    scopeRevision: 1,
    scopeStatus: "APPROVED",
    pricingVersion: COMMERCIAL_PRICING_VERSION,
    pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
  });

  const pricing = await prisma.commercialPricing.create({
    data: {
      opportunityId: opportunity.id,
      commercialScopeId: scope.id,
      status: "APPROVED",
      revision: 1,
      currency: "USD",
      pricingVersion: COMMERCIAL_PRICING_VERSION,
      pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
      sourceFingerprint: pricingFingerprint,
      recommendedIncludedCents: includedCents,
      recommendedOptionalCents: 0,
      recommendedTotalCents: includedCents,
      finalIncludedCents: includedCents,
      finalOptionalCents: 0,
      finalTotalCents: includedCents,
      minimumEngagementCents: 75_000,
      minimumApplied: false,
      assessmentOnly: false,
      approvedAt: new Date(),
      approvedByEmail: COMMERCIAL_E2E_ACTOR,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
      lineItems: {
        create: [
          {
            workUnitKey: "heading-architecture",
            title: "Heading Architecture",
            workType: "IMPLEMENTATION",
            effortBand: "MEDIUM",
            quantity: 1,
            recommendedUnitPriceCents: 35_000,
            recommendedLineTotalCents: 35_000,
            finalUnitPriceCents: includedCents,
            finalLineTotalCents: includedCents,
            isIncluded: true,
            isOptional: false,
            isCustom: false,
            isOverridden: true,
            overrideReason: "E2E fixed total for payment-term assertions",
            sourceDeliverableIdsJson: deliverableIds,
            sourceSectionTitlesJson: [
              "Search Optimization",
              "Content Foundation",
            ],
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const proposalSnapshot: ProposalSnapshot = {
    businessName,
    locationLabel: "Austin, TX",
    currency: "USD",
    includedInvestmentCents: includedCents,
    optionalInvestmentCents: 0,
    totalInvestmentCents: includedCents,
    engagementAdjustmentCents: 0,
    investmentIntro: "Investment for included implementation work.",
    methodologyFooter: "Pricing follows approved Scope and Pricing.",
    sections: [
      {
        title: "Search Optimization",
        clientValueExplanation: "Clearer page structure for visitors.",
        capabilities: [],
        isOptional: false,
        deliverables: [
          {
            title: "Heading architecture improvements",
            sourceTitle: "Heading architecture improvements",
            isOptional: false,
          },
        ],
      },
      {
        title: "Content Foundation",
        clientValueExplanation: "Stronger service-page content structure.",
        capabilities: [],
        isOptional: false,
        deliverables: [
          {
            title: "Heading structure for service pages",
            sourceTitle: "Heading structure for service pages",
            isOptional: false,
          },
        ],
      },
    ],
    optionalSections: [],
    assumptions: ["Client provides CMS access."],
    exclusions: ["Paid advertising not included."],
    considerations: ["Legacy theme may limit layout changes."],
    includedInvestmentGroups: [],
    optionalInvestmentGroups: [],
    includedLines: [],
    optionalLines: [],
  };

  const proposalFingerprint = buildProposalSourceFingerprint({
    opportunityId: opportunity.id,
    commercialScopeId: scope.id,
    scopeRevision: 1,
    commercialPricingId: pricing.id,
    pricingRevision: 1,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  });

  const proposal = await prisma.commercialProposal.create({
    data: {
      opportunityId: opportunity.id,
      commercialScopeId: scope.id,
      commercialPricingId: pricing.id,
      status: "APPROVED",
      revision: 1,
      title: "Website Growth Implementation Proposal",
      executiveSummary: "Recommended website improvements for growth.",
      approachIntro: "We will implement the approved scope.",
      timelineNote: "Timeline confirmed after acceptance.",
      nextStepText: "Review and accept the proposal to proceed.",
      currency: "USD",
      includedInvestmentCents: includedCents,
      optionalInvestmentCents: 0,
      totalInvestmentCents: includedCents,
      snapshotJson: proposalSnapshot,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
      sourceFingerprint: proposalFingerprint,
      approvedAt: new Date(),
      approvedByEmail: COMMERCIAL_E2E_ACTOR,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
    },
  });

  const proposalShareToken = makeToken();
  const proposalDelivery = await prisma.proposalDelivery.create({
    data: {
      opportunityId: opportunity.id,
      proposalId: proposal.id,
      recipientName: "Jane Client",
      recipientEmail: "jane.client@example.com",
      status: "SENT",
      subjectSnapshot: `Website Growth Implementation Proposal — ${businessName}`,
      messageSnapshot: "Please review the proposal.",
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      proposalPresentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
      shareTokenHash: hashToken(proposalShareToken),
      preparedByEmail: COMMERCIAL_E2E_ACTOR,
      sentAt: new Date(),
      sentByEmail: COMMERCIAL_E2E_ACTOR,
      deliveryProvider: "RESEND",
      providerMessageId: "mock-proposal-send",
      decision: withAccepted ? "ACCEPTED" : "PENDING",
      decisionAt: withAccepted ? new Date() : null,
      decisionRecordedByEmail: withAccepted ? COMMERCIAL_E2E_ACTOR : null,
    },
  });

  const builtAgreement = buildAgreementFromApprovedSources({
    proposal: {
      id: proposal.id,
      revision: 1,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
      title: proposal.title,
      snapshot: proposalSnapshot,
    },
    authority: {
      opportunityId: opportunity.id,
      scopeId: scope.id,
      scopeRevision: 1,
      pricingId: pricing.id,
      pricingRevision: 1,
      currency: "USD",
      includedInvestmentCents: includedCents,
      optionalInvestmentCents: 0,
      totalInvestmentCents: includedCents,
    },
    businessName,
    locationLabel: "Austin, TX",
    presentation: {
      paymentTermType,
    },
  });

  const agreementFingerprint = buildAgreementSourceFingerprint({
    opportunityId: opportunity.id,
    proposalId: proposal.id,
    proposalRevision: 1,
    commercialScopeId: scope.id,
    scopeRevision: 1,
    commercialPricingId: pricing.id,
    pricingRevision: 1,
    agreementVersion: COMMERCIAL_AGREEMENT_VERSION,
    agreementPresentationVersion: COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
    termsVersion: COMMERCIAL_AGREEMENT_TERMS_VERSION,
    paymentTermType: builtAgreement.paymentTermType,
    depositPercent: builtAgreement.depositPercent,
    paymentCustomText: builtAgreement.paymentCustomText,
  });

  const agreement = await prisma.commercialAgreement.create({
    data: {
      opportunityId: opportunity.id,
      proposalId: proposal.id,
      commercialScopeId: scope.id,
      commercialPricingId: pricing.id,
      status: "APPROVED",
      revision: 1,
      agreementVersion: COMMERCIAL_AGREEMENT_VERSION,
      agreementPresentationVersion: COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
      termsVersion: COMMERCIAL_AGREEMENT_TERMS_VERSION,
      title: builtAgreement.title,
      sourceFingerprint: agreementFingerprint,
      snapshotJson: builtAgreement.snapshot,
      engagementOverview: builtAgreement.engagementOverview,
      clientResponsibilitiesJson: builtAgreement.clientResponsibilities,
      jsResponsibilitiesJson: builtAgreement.jsResponsibilities,
      timelineTerms: builtAgreement.timelineTerms,
      changeRequestTerms: builtAgreement.changeRequestTerms,
      thirdPartyCostTerms: builtAgreement.thirdPartyCostTerms,
      resultsDisclaimer: builtAgreement.resultsDisclaimer,
      acceptanceLanguage: builtAgreement.acceptanceLanguage,
      paymentTermType: builtAgreement.paymentTermType,
      paymentCustomText: builtAgreement.paymentCustomText,
      depositPercent: builtAgreement.depositPercent,
      currency: "USD",
      includedInvestmentCents: includedCents,
      optionalInvestmentCents: 0,
      totalInvestmentCents: includedCents,
      depositCents: builtAgreement.depositCents,
      balanceCents: builtAgreement.balanceCents,
      proposalReference: builtAgreement.proposalReference,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
      reviewedAt: new Date(),
      reviewedByEmail: COMMERCIAL_E2E_ACTOR,
      approvedAt: new Date(),
      approvedByEmail: COMMERCIAL_E2E_ACTOR,
    },
  });

  const agreementShareToken = makeToken();
  const agreementDelivery = await prisma.agreementDelivery.create({
    data: {
      opportunityId: opportunity.id,
      agreementId: agreement.id,
      recipientName: "Jane Client",
      recipientEmail: "jane.client@example.com",
      status: "READY",
      subjectSnapshot: `Website Growth Implementation Agreement — ${businessName}`,
      messageSnapshot: "Please review and accept the agreement.",
      agreementVersion: COMMERCIAL_AGREEMENT_VERSION,
      agreementPresentationVersion: COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
      termsVersion: COMMERCIAL_AGREEMENT_TERMS_VERSION,
      shareTokenHash: hashToken(agreementShareToken),
      preparedByEmail: COMMERCIAL_E2E_ACTOR,
    },
  });

  return {
    runId,
    businessName,
    campaignId: campaign.id,
    prospectId: prospect.id,
    opportunityId: opportunity.id,
    scopeId: scope.id,
    pricingId: pricing.id,
    proposalId: proposal.id,
    proposalShareToken,
    proposalDeliveryId: proposalDelivery.id,
    agreementId: agreement.id,
    agreementShareToken,
    agreementDeliveryId: agreementDelivery.id,
    totalInvestmentCents: includedCents,
    depositCents: builtAgreement.depositCents ?? 0,
    balanceCents: builtAgreement.balanceCents ?? 0,
  };
}

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  rebuildAgreementSnapshotFromRow,
} from "./build";
import {
  MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS,
  MAX_AGREEMENT_OVERVIEW_CHARS,
  MAX_AGREEMENT_RESPONSIBILITY_ITEM_CHARS,
  MAX_AGREEMENT_RESPONSIBILITY_ITEMS,
  MAX_AGREEMENT_TERM_CHARS,
  MAX_AGREEMENT_TITLE_CHARS,
  type AgreementPaymentTermType,
} from "./constants";
import { buildAgreementSourceFingerprint } from "./fingerprint";
import { hashAgreementSnapshot } from "./hash";
import {
  buildPaymentTermsSnapshot,
  validateCustomPaymentTerms,
} from "./payment-terms";
import { evaluateAgreementStaleness } from "./staleness";
import type { AgreementSnapshot } from "./types";

export type AgreementMutationResult =
  | { ok: true; agreementId: string }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "IMMUTABLE"
        | "INVALID_INPUT"
        | "STALE"
        | "INCOMPLETE";
      message: string;
    };

function sanitizeStringList(
  items: string[] | undefined,
  maxItems: number,
  maxItemChars: number,
): string[] | undefined {
  if (items === undefined) {
    return undefined;
  }
  return items
    .map((item) => item.trim().slice(0, maxItemChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

async function requireEditableAgreement(agreementId: string) {
  const agreement = await prisma.commercialAgreement.findUnique({
    where: { id: agreementId },
    include: {
      opportunity: {
        select: {
          prospect: {
            select: { businessName: true, city: true, state: true },
          },
        },
      },
      proposal: { select: { id: true, revision: true } },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!agreement) {
    return {
      ok: false as const,
      code: "NOT_FOUND" as const,
      message: "Agreement not found.",
    };
  }

  if (
    agreement.status === "APPROVED" ||
    agreement.status === "ACCEPTED" ||
    agreement.status === "SUPERSEDED" ||
    agreement.status === "VOIDED"
  ) {
    return {
      ok: false as const,
      code: "IMMUTABLE" as const,
      message:
        "Approved, accepted, superseded, and voided Agreements are immutable. Use Revise to create a new draft.",
    };
  }

  return { ok: true as const, agreement };
}

async function rebuildAndPersistSnapshot(agreement: {
  id: string;
  opportunityId: string;
  proposalId: string;
  commercialScopeId: string;
  commercialPricingId: string;
  agreementVersion: number;
  agreementPresentationVersion: number;
  termsVersion: number;
  title: string;
  proposalReference: string;
  engagementOverview: string;
  clientResponsibilitiesJson: unknown;
  jsResponsibilitiesJson: unknown;
  timelineTerms: string;
  changeRequestTerms: string;
  thirdPartyCostTerms: string;
  resultsDisclaimer: string;
  acceptanceLanguage: string;
  paymentTermType: import("./constants").AgreementPaymentTermType;
  paymentCustomText: string | null;
  depositPercent: number;
  currency: string;
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  totalInvestmentCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  snapshotJson: unknown;
  approvedAt: Date | null;
  createdAt: Date;
  proposal: { revision: number };
  commercialScope: { revision: number };
  commercialPricing: { revision: number };
  opportunity: {
    prospect: { businessName: string; city: string | null; state: string | null };
  };
}) {
  const snapshot = rebuildAgreementSnapshotFromRow({
    title: agreement.title,
    proposalReference: agreement.proposalReference,
    engagementOverview: agreement.engagementOverview,
    clientResponsibilitiesJson: agreement.clientResponsibilitiesJson,
    jsResponsibilitiesJson: agreement.jsResponsibilitiesJson,
    timelineTerms: agreement.timelineTerms,
    changeRequestTerms: agreement.changeRequestTerms,
    thirdPartyCostTerms: agreement.thirdPartyCostTerms,
    resultsDisclaimer: agreement.resultsDisclaimer,
    acceptanceLanguage: agreement.acceptanceLanguage,
    paymentTermType: agreement.paymentTermType,
    paymentCustomText: agreement.paymentCustomText,
    depositPercent: agreement.depositPercent,
    currency: agreement.currency,
    includedInvestmentCents: agreement.includedInvestmentCents,
    optionalInvestmentCents: agreement.optionalInvestmentCents,
    totalInvestmentCents: agreement.totalInvestmentCents,
    depositCents: agreement.depositCents,
    balanceCents: agreement.balanceCents,
    snapshotJson: agreement.snapshotJson,
    approvedAt: agreement.approvedAt,
    createdAt: agreement.createdAt,
    opportunity: agreement.opportunity,
  });

  const paymentTerms = buildPaymentTermsSnapshot({
    type: agreement.paymentTermType,
    totalCents: agreement.totalInvestmentCents,
    depositPercent: agreement.depositPercent,
    customText: agreement.paymentCustomText,
  });

  const sourceFingerprint = buildAgreementSourceFingerprint({
    opportunityId: agreement.opportunityId,
    proposalId: agreement.proposalId,
    proposalRevision: agreement.proposal.revision,
    commercialScopeId: agreement.commercialScopeId,
    scopeRevision: agreement.commercialScope.revision,
    commercialPricingId: agreement.commercialPricingId,
    pricingRevision: agreement.commercialPricing.revision,
    agreementVersion: agreement.agreementVersion,
    agreementPresentationVersion: agreement.agreementPresentationVersion,
    termsVersion: agreement.termsVersion,
    paymentTermType: agreement.paymentTermType,
    depositPercent: agreement.depositPercent,
    paymentCustomText: agreement.paymentCustomText,
  });

  await prisma.commercialAgreement.update({
    where: { id: agreement.id },
    data: {
      snapshotJson: snapshot as unknown as Prisma.InputJsonValue,
      sourceFingerprint,
      depositCents: paymentTerms.depositCents,
      balanceCents: paymentTerms.balanceCents,
    },
  });
}

export async function updateAgreementPresentation(options: {
  agreementId: string;
  title?: string;
  engagementOverview?: string;
  clientResponsibilities?: string[];
  jsResponsibilities?: string[];
  timelineTerms?: string;
  changeRequestTerms?: string;
  thirdPartyCostTerms?: string;
  resultsDisclaimer?: string;
  acceptanceLanguage?: string;
  paymentTermType?: AgreementPaymentTermType;
  paymentCustomText?: string | null;
  depositPercent?: number;
  actorEmail: string;
}): Promise<AgreementMutationResult> {
  const gate = await requireEditableAgreement(options.agreementId);
  if (!gate.ok) {
    return gate;
  }

  const data: Prisma.CommercialAgreementUpdateInput = {};

  if (options.title !== undefined) {
    const title = options.title.trim().slice(0, MAX_AGREEMENT_TITLE_CHARS);
    if (!title) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Agreement title is required.",
      };
    }
    data.title = title;
  }

  if (options.engagementOverview !== undefined) {
    data.engagementOverview = options.engagementOverview
      .trim()
      .slice(0, MAX_AGREEMENT_OVERVIEW_CHARS);
  }

  const clientResp = sanitizeStringList(
    options.clientResponsibilities,
    MAX_AGREEMENT_RESPONSIBILITY_ITEMS,
    MAX_AGREEMENT_RESPONSIBILITY_ITEM_CHARS,
  );
  if (clientResp !== undefined) {
    if (clientResp.length === 0) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "At least one client responsibility is required.",
      };
    }
    data.clientResponsibilitiesJson =
      clientResp as unknown as Prisma.InputJsonValue;
  }

  const jsResp = sanitizeStringList(
    options.jsResponsibilities,
    MAX_AGREEMENT_RESPONSIBILITY_ITEMS,
    MAX_AGREEMENT_RESPONSIBILITY_ITEM_CHARS,
  );
  if (jsResp !== undefined) {
    if (jsResp.length === 0) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "At least one JS Solutions responsibility is required.",
      };
    }
    data.jsResponsibilitiesJson = jsResp as unknown as Prisma.InputJsonValue;
  }

  if (options.timelineTerms !== undefined) {
    data.timelineTerms = options.timelineTerms
      .trim()
      .slice(0, MAX_AGREEMENT_TERM_CHARS);
  }
  if (options.changeRequestTerms !== undefined) {
    data.changeRequestTerms = options.changeRequestTerms
      .trim()
      .slice(0, MAX_AGREEMENT_TERM_CHARS);
  }
  if (options.thirdPartyCostTerms !== undefined) {
    data.thirdPartyCostTerms = options.thirdPartyCostTerms
      .trim()
      .slice(0, MAX_AGREEMENT_TERM_CHARS);
  }
  if (options.resultsDisclaimer !== undefined) {
    data.resultsDisclaimer = options.resultsDisclaimer
      .trim()
      .slice(0, MAX_AGREEMENT_TERM_CHARS);
  }
  if (options.acceptanceLanguage !== undefined) {
    data.acceptanceLanguage = options.acceptanceLanguage
      .trim()
      .slice(0, MAX_AGREEMENT_TERM_CHARS);
  }

  if (options.paymentTermType !== undefined) {
    data.paymentTermType = options.paymentTermType;
  }

  if (options.paymentCustomText !== undefined) {
    data.paymentCustomText =
      options.paymentCustomText?.trim().slice(0, MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS) ||
      null;
  }

  if (options.depositPercent !== undefined) {
    const pct = Math.min(99, Math.max(1, Math.floor(options.depositPercent)));
    data.depositPercent = pct;
  }

  await prisma.commercialAgreement.update({
    where: { id: options.agreementId },
    data,
  });

  const refreshed = await requireEditableAgreement(options.agreementId);
  if (refreshed.ok) {
    await rebuildAndPersistSnapshot(refreshed.agreement);
  }

  return { ok: true, agreementId: options.agreementId };
}

export async function markAgreementReviewed(options: {
  agreementId: string;
  actorEmail: string;
}): Promise<AgreementMutationResult> {
  const gate = await requireEditableAgreement(options.agreementId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.agreement.status === "REVIEWED") {
    return { ok: true, agreementId: options.agreementId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialAgreement.update({
      where: { id: options.agreementId },
      data: {
        status: "REVIEWED",
        reviewedAt: new Date(),
        reviewedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.agreement.opportunityId,
        type: "AGREEMENT_REVIEWED",
        actorEmail: options.actorEmail,
        toValueJson: {
          agreementId: options.agreementId,
          revision: gate.agreement.revision,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, agreementId: options.agreementId };
}

function validateAgreementCompleteness(agreement: {
  paymentTermType: AgreementPaymentTermType;
  paymentCustomText: string | null;
  engagementOverview: string;
  acceptanceLanguage: string;
  resultsDisclaimer: string;
}): AgreementMutationResult | null {
  if (!agreement.engagementOverview.trim()) {
    return {
      ok: false,
      code: "INCOMPLETE",
      message: "Engagement overview is required.",
    };
  }
  if (!agreement.acceptanceLanguage.trim()) {
    return {
      ok: false,
      code: "INCOMPLETE",
      message: "Acceptance language is required.",
    };
  }
  if (!agreement.resultsDisclaimer.trim()) {
    return {
      ok: false,
      code: "INCOMPLETE",
      message: "Results disclaimer is required.",
    };
  }
  if (
    agreement.paymentTermType === "CUSTOM" &&
    !validateCustomPaymentTerms(agreement.paymentCustomText)
  ) {
    return {
      ok: false,
      code: "INCOMPLETE",
      message: "Custom payment terms require explicit payment text.",
    };
  }
  return null;
}

export async function approveAgreement(options: {
  agreementId: string;
  actorEmail: string;
}): Promise<AgreementMutationResult> {
  const gate = await requireEditableAgreement(options.agreementId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.agreement.status !== "REVIEWED") {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Mark the Agreement reviewed before approving.",
    };
  }

  const completeness = validateAgreementCompleteness(gate.agreement);
  if (completeness) {
    return completeness;
  }

  const staleness = evaluateAgreementStaleness({
    storedFingerprint: gate.agreement.sourceFingerprint,
    current: {
      opportunityId: gate.agreement.opportunityId,
      proposalId: gate.agreement.proposalId,
      proposalRevision: gate.agreement.proposal.revision,
      commercialScopeId: gate.agreement.commercialScopeId,
      scopeRevision: gate.agreement.commercialScope.revision,
      commercialPricingId: gate.agreement.commercialPricingId,
      pricingRevision: gate.agreement.commercialPricing.revision,
      agreementVersion: gate.agreement.agreementVersion,
      agreementPresentationVersion: gate.agreement.agreementPresentationVersion,
      termsVersion: gate.agreement.termsVersion,
      paymentTermType: gate.agreement.paymentTermType,
      depositPercent: gate.agreement.depositPercent,
      paymentCustomText: gate.agreement.paymentCustomText,
    },
  });

  if (staleness.stale) {
    return {
      ok: false,
      code: "STALE",
      message:
        "Agreement is stale relative to upstream commercial authority. Revise before approval.",
    };
  }

  await rebuildAndPersistSnapshot(gate.agreement);

  const approved = await prisma.commercialAgreement.findUnique({
    where: { id: options.agreementId },
  });
  if (!approved) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Agreement not found.",
    };
  }

  const snapshot = approved.snapshotJson as unknown as AgreementSnapshot;
  hashAgreementSnapshot(snapshot);

  await prisma.$transaction(async (tx) => {
    await tx.commercialAgreement.update({
      where: { id: options.agreementId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.agreement.opportunityId,
        type: "AGREEMENT_APPROVED",
        actorEmail: options.actorEmail,
        toValueJson: {
          agreementId: options.agreementId,
          revision: gate.agreement.revision,
          totalInvestmentCents: gate.agreement.totalInvestmentCents,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, agreementId: options.agreementId };
}

export async function voidAgreement(options: {
  agreementId: string;
  actorEmail: string;
  reason?: string;
}): Promise<AgreementMutationResult> {
  const agreement = await prisma.commercialAgreement.findUnique({
    where: { id: options.agreementId },
  });

  if (!agreement) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Agreement not found.",
    };
  }

  if (agreement.status === "ACCEPTED") {
    return {
      ok: false,
      code: "IMMUTABLE",
      message: "Accepted Agreements cannot be voided.",
    };
  }

  if (agreement.status === "VOIDED" || agreement.status === "SUPERSEDED") {
    return { ok: true, agreementId: options.agreementId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialAgreement.update({
      where: { id: options.agreementId },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        voidedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: agreement.opportunityId,
        type: "AGREEMENT_VOIDED",
        actorEmail: options.actorEmail,
        toValueJson: {
          agreementId: options.agreementId,
          revision: agreement.revision,
        } as Prisma.InputJsonValue,
        note: options.reason?.trim().slice(0, 500) || null,
      },
    });
  });

  return { ok: true, agreementId: options.agreementId };
}

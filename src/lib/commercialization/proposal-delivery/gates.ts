import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "@/lib/commercialization/proposal/constants";
import { evaluateProposalStaleness } from "@/lib/commercialization/proposal/staleness";
import { prisma } from "@/lib/prisma";

import {
  isValidRecipientEmail,
  normalizeRecipientEmail,
  type ProposalDeliveryStatus,
} from "./constants";

export type ProposalDeliveryGateFailure =
  | "MISSING_OPPORTUNITY"
  | "TERMINAL_OPPORTUNITY"
  | "MISSING_PROPOSAL"
  | "PROPOSAL_NOT_APPROVED"
  | "PROPOSAL_NOT_CURRENT"
  | "PROPOSAL_SCOPE_MISMATCH"
  | "INVALID_RECIPIENT"
  | "DELIVERY_NOT_EDITABLE"
  | "DELIVERY_NOT_READY"
  | "DELIVERY_ALREADY_SENT"
  | "DELIVERY_REVOKED"
  | "DELIVERY_NOT_FOUND";

export interface ApprovedCurrentProposalContext {
  proposal: {
    id: string;
    opportunityId: string;
    revision: number;
    title: string;
    status: "APPROVED";
    proposalVersion: number;
    presentationVersion: number;
    businessName: string;
    stale: boolean;
  };
}

export async function loadApprovedCurrentProposalContext(options: {
  opportunityId: string;
  proposalId: string;
}): Promise<
  | { ok: true; context: ApprovedCurrentProposalContext }
  | { ok: false; code: ProposalDeliveryGateFailure; message: string }
> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    select: { id: true, stage: true },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "MISSING_OPPORTUNITY",
      message: "Opportunity not found.",
    };
  }

  if (opportunity.stage === "LOST") {
    return {
      ok: false,
      code: "TERMINAL_OPPORTUNITY",
      message: "Cannot deliver a proposal on a lost Opportunity.",
    };
  }

  const proposal = await prisma.commercialProposal.findFirst({
    where: {
      id: options.proposalId,
      opportunityId: options.opportunityId,
    },
    include: {
      opportunity: {
        select: {
          prospect: { select: { businessName: true } },
        },
      },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!proposal) {
    return {
      ok: false,
      code: "MISSING_PROPOSAL",
      message: "Proposal not found for this Opportunity.",
    };
  }

  if (proposal.status !== "APPROVED") {
    return {
      ok: false,
      code: "PROPOSAL_NOT_APPROVED",
      message: "Only an approved Proposal can be delivered.",
    };
  }

  const [currentScope, currentPricing] = await Promise.all([
    prisma.commercialScope.findFirst({
      where: { opportunityId: options.opportunityId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
    prisma.commercialPricing.findFirst({
      where: { opportunityId: options.opportunityId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
  ]);

  const staleness = evaluateProposalStaleness({
    storedFingerprint: proposal.sourceFingerprint,
    current: {
      opportunityId: options.opportunityId,
      commercialScopeId: currentScope?.id ?? proposal.commercialScopeId,
      scopeRevision: currentScope?.revision ?? proposal.commercialScope.revision,
      commercialPricingId:
        currentPricing?.id ?? proposal.commercialPricingId,
      pricingRevision:
        currentPricing?.revision ?? proposal.commercialPricing.revision,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  });

  if (staleness.stale) {
    return {
      ok: false,
      code: "PROPOSAL_NOT_CURRENT",
      message:
        "Proposal is stale relative to current approved Scope or Pricing. Revise the Proposal before delivery.",
    };
  }

  return {
    ok: true,
    context: {
      proposal: {
        id: proposal.id,
        opportunityId: proposal.opportunityId,
        revision: proposal.revision,
        title: proposal.title,
        status: "APPROVED",
        proposalVersion: proposal.proposalVersion,
        presentationVersion: proposal.presentationVersion,
        businessName: proposal.opportunity.prospect.businessName,
        stale: false,
      },
    },
  };
}

export function validateRecipientInput(options: {
  recipientName: string;
  recipientEmail: string;
}):
  | { ok: true; recipientName: string; recipientEmail: string }
  | { ok: false; code: "INVALID_RECIPIENT"; message: string } {
  const recipientName = options.recipientName.trim();
  const recipientEmail = normalizeRecipientEmail(options.recipientEmail);

  if (!recipientName) {
    return {
      ok: false,
      code: "INVALID_RECIPIENT",
      message: "Recipient name is required.",
    };
  }

  if (!isValidRecipientEmail(recipientEmail)) {
    return {
      ok: false,
      code: "INVALID_RECIPIENT",
      message: "A valid recipient email is required.",
    };
  }

  return { ok: true, recipientName, recipientEmail };
}

export function isEditableDeliveryStatus(
  status: ProposalDeliveryStatus,
): boolean {
  return status === "DRAFT" || status === "READY" || status === "FAILED";
}

export function canSendDeliveryStatus(status: ProposalDeliveryStatus): boolean {
  return status === "READY" || status === "FAILED";
}

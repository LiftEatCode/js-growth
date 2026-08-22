import "server-only";

import {
  PROPOSAL_INVESTMENT_INTRO,
  PROPOSAL_METHODOLOGY_FOOTER,
  stripInternalAuditLanguage,
  isInternalAuditFindingLanguage,
} from "@/lib/commercialization/proposal/presentation";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";
import { prisma } from "@/lib/prisma";

import {
  proposalDecisionLabel,
  proposalDeliveryStatusLabel,
  type ProposalDecision,
  type ProposalDeliveryStatus,
} from "./constants";
import { hashProposalShareToken } from "./token";

function parseSnapshot(raw: unknown): ProposalSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const snap = raw as ProposalSnapshot;
  return {
    ...snap,
    investmentIntro: snap.investmentIntro ?? PROPOSAL_INVESTMENT_INTRO,
    methodologyFooter: snap.methodologyFooter ?? PROPOSAL_METHODOLOGY_FOOTER,
    sections: (snap.sections ?? []).map((section) => {
      const legacyDescription =
        "description" in section
          ? ((section as { description?: string | null }).description ?? null)
          : null;
      const legacyClean = legacyDescription
        ? stripInternalAuditLanguage(legacyDescription)
        : null;
      return {
        ...section,
        clientValueExplanation:
          section.clientValueExplanation ??
          (legacyClean && !isInternalAuditFindingLanguage(legacyClean)
            ? legacyClean
            : null),
        deliverables: (section.deliverables ?? []).map((d) => ({
          title: d.title,
          sourceTitle: d.sourceTitle ?? d.title,
          isOptional: d.isOptional,
        })),
      };
    }),
    optionalSections: snap.optionalSections ?? [],
    includedInvestmentGroups: snap.includedInvestmentGroups ?? [],
    optionalInvestmentGroups: snap.optionalInvestmentGroups ?? [],
    includedLines: snap.includedLines ?? [],
    optionalLines: snap.optionalLines ?? [],
    assumptions: snap.assumptions ?? [],
    exclusions: snap.exclusions ?? [],
    considerations: snap.considerations ?? [],
  };
}

export interface LoadedProposalDeliverySummary {
  id: string;
  proposalId: string;
  proposalRevision: number;
  status: ProposalDeliveryStatus;
  statusLabel: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  message: string;
  sentAt: Date | null;
  sentByEmail: string | null;
  revokedAt: Date | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  viewCount: number;
  viewLabel: string;
  decision: ProposalDecision;
  decisionLabel: string;
  decisionAt: Date | null;
  decisionNote: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Date;
  isCurrentProposal: boolean;
}

function viewLabelForDelivery(delivery: {
  viewCount: number;
  firstViewedAt: Date | null;
}): string {
  if (delivery.viewCount <= 0 || !delivery.firstViewedAt) {
    return "Not viewed";
  }
  if (delivery.viewCount === 1) {
    return "Proposal link viewed once";
  }
  return `Proposal link viewed ${delivery.viewCount} times`;
}

export async function loadProposalDeliveriesForOpportunity(options: {
  opportunityId: string;
  currentProposalId: string | null;
}): Promise<LoadedProposalDeliverySummary[]> {
  const rows = await prisma.proposalDelivery.findMany({
    where: { opportunityId: options.opportunityId },
    orderBy: { createdAt: "desc" },
    include: {
      proposal: { select: { revision: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    proposalId: row.proposalId,
    proposalRevision: row.proposal.revision,
    status: row.status,
    statusLabel: proposalDeliveryStatusLabel(row.status),
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    subject: row.subjectSnapshot,
    message: row.messageSnapshot,
    sentAt: row.sentAt,
    sentByEmail: row.sentByEmail,
    revokedAt: row.revokedAt,
    firstViewedAt: row.firstViewedAt,
    lastViewedAt: row.lastViewedAt,
    viewCount: row.viewCount,
    viewLabel: viewLabelForDelivery(row),
    decision: row.decision,
    decisionLabel: proposalDecisionLabel(row.decision),
    decisionAt: row.decisionAt,
    decisionNote: row.decisionNote,
    failureCode: row.failureCode,
    failureMessage: row.failureMessage,
    createdAt: row.createdAt,
    isCurrentProposal: row.proposalId === options.currentProposalId,
  }));
}

export async function loadProposalDeliveryContactOptions(options: {
  opportunityId: string;
}): Promise<
  Array<{
    email: string;
    name: string | null;
    isPrimary: boolean;
  }>
> {
  const row = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    select: {
      prospect: {
        select: {
          contacts: {
            where: {
              email: { not: "" },
            },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
            select: {
              email: true,
              name: true,
              isPrimary: true,
            },
          },
        },
      },
    },
  });

  return row?.prospect.contacts ?? [];
}

export async function loadPublicProposalByShareToken(options: {
  shareToken: string;
}): Promise<{
  title: string;
  executiveSummary: string;
  businessContext: string | null;
  approachIntro: string | null;
  timelineNote: string | null;
  nextStepText: string | null;
  snapshot: ProposalSnapshot;
  createdAtLabel: string;
} | null> {
  const shareTokenHash = hashProposalShareToken(options.shareToken);
  const delivery = await prisma.proposalDelivery.findUnique({
    where: { shareTokenHash },
    include: {
      proposal: true,
    },
  });

  if (!delivery || delivery.revokedAt) {
    return null;
  }

  if (delivery.proposal.status !== "APPROVED") {
    return null;
  }

  const snapshot = parseSnapshot(delivery.proposal.snapshotJson);
  if (!snapshot) {
    return null;
  }

  const createdAtLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(delivery.proposal.approvedAt ?? delivery.proposal.createdAt);

  return {
    title: delivery.proposal.title,
    executiveSummary: delivery.proposal.executiveSummary,
    businessContext: delivery.proposal.businessContext,
    approachIntro: delivery.proposal.approachIntro,
    timelineNote: delivery.proposal.timelineNote,
    nextStepText: delivery.proposal.nextStepText,
    snapshot,
    createdAtLabel,
  };
}

export async function findDeliveryIdByShareToken(
  shareToken: string,
): Promise<string | null> {
  const shareTokenHash = hashProposalShareToken(shareToken);
  const delivery = await prisma.proposalDelivery.findUnique({
    where: { shareTokenHash },
    select: { id: true, revokedAt: true },
  });
  if (!delivery || delivery.revokedAt) {
    return null;
  }
  return delivery.id;
}

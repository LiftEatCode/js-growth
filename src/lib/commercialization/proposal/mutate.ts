import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  MAX_PROPOSAL_APPROACH_CHARS,
  MAX_PROPOSAL_CONTEXT_CHARS,
  MAX_PROPOSAL_NEXT_STEP_CHARS,
  MAX_PROPOSAL_SUMMARY_CHARS,
  MAX_PROPOSAL_TIMELINE_CHARS,
  MAX_PROPOSAL_TITLE_CHARS,
} from "./constants";

export type ProposalMutationResult =
  | { ok: true; proposalId: string }
  | {
      ok: false;
      code: "NOT_FOUND" | "IMMUTABLE" | "INVALID_INPUT";
      message: string;
    };

async function requireEditableProposal(proposalId: string) {
  const proposal = await prisma.commercialProposal.findUnique({
    where: { id: proposalId },
  });
  if (!proposal) {
    return {
      ok: false as const,
      code: "NOT_FOUND" as const,
      message: "Proposal not found.",
    };
  }
  if (proposal.status === "APPROVED" || proposal.status === "SUPERSEDED") {
    return {
      ok: false as const,
      code: "IMMUTABLE" as const,
      message:
        "Approved and superseded Proposals are immutable. Use Revise to create a new draft.",
    };
  }
  return { ok: true as const, proposal };
}

export async function updateProposalPresentation(options: {
  proposalId: string;
  title?: string;
  executiveSummary?: string;
  businessContext?: string | null;
  approachIntro?: string | null;
  timelineNote?: string | null;
  nextStepText?: string | null;
  actorEmail: string;
}): Promise<ProposalMutationResult> {
  const gate = await requireEditableProposal(options.proposalId);
  if (!gate.ok) {
    return gate;
  }

  const data: Prisma.CommercialProposalUpdateInput = {};

  if (options.title !== undefined) {
    const title = options.title.trim().slice(0, MAX_PROPOSAL_TITLE_CHARS);
    if (!title) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Proposal title is required.",
      };
    }
    data.title = title;
  }

  if (options.executiveSummary !== undefined) {
    const summary = options.executiveSummary
      .trim()
      .slice(0, MAX_PROPOSAL_SUMMARY_CHARS);
    if (!summary) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: "Executive summary is required.",
      };
    }
    data.executiveSummary = summary;
  }

  if (options.businessContext !== undefined) {
    data.businessContext =
      options.businessContext?.trim().slice(0, MAX_PROPOSAL_CONTEXT_CHARS) ||
      null;
  }

  if (options.approachIntro !== undefined) {
    data.approachIntro =
      options.approachIntro?.trim().slice(0, MAX_PROPOSAL_APPROACH_CHARS) ||
      null;
  }

  if (options.timelineNote !== undefined) {
    data.timelineNote =
      options.timelineNote?.trim().slice(0, MAX_PROPOSAL_TIMELINE_CHARS) || null;
  }

  if (options.nextStepText !== undefined) {
    data.nextStepText =
      options.nextStepText?.trim().slice(0, MAX_PROPOSAL_NEXT_STEP_CHARS) ||
      null;
  }

  await prisma.commercialProposal.update({
    where: { id: options.proposalId },
    data,
  });

  return { ok: true, proposalId: options.proposalId };
}

export async function markProposalReviewed(options: {
  proposalId: string;
  actorEmail: string;
}): Promise<ProposalMutationResult> {
  const gate = await requireEditableProposal(options.proposalId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.proposal.status === "REVIEWED") {
    return { ok: true, proposalId: options.proposalId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialProposal.update({
      where: { id: options.proposalId },
      data: { status: "REVIEWED" },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.proposal.opportunityId,
        type: "PROPOSAL_REVIEWED",
        actorEmail: options.actorEmail,
        toValueJson: {
          proposalId: options.proposalId,
          revision: gate.proposal.revision,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, proposalId: options.proposalId };
}

export async function approveProposal(options: {
  proposalId: string;
  actorEmail: string;
}): Promise<ProposalMutationResult> {
  const gate = await requireEditableProposal(options.proposalId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.proposal.status !== "REVIEWED") {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Mark the Proposal reviewed before approving.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialProposal.update({
      where: { id: options.proposalId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.proposal.opportunityId,
        type: "PROPOSAL_APPROVED",
        actorEmail: options.actorEmail,
        toValueJson: {
          proposalId: options.proposalId,
          revision: gate.proposal.revision,
          totalInvestmentCents: gate.proposal.totalInvestmentCents,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, proposalId: options.proposalId };
}

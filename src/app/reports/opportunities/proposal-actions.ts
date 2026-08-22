"use server";

import { revalidatePath } from "next/cache";

import {
  createProposalForOpportunity,
  reviseProposalForOpportunity,
} from "@/lib/commercialization/proposal/create";
import {
  approveProposal,
  markProposalReviewed,
  updateProposalPresentation,
} from "@/lib/commercialization/proposal/mutate";
import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface ProposalActionResult {
  success: boolean;
  message?: string;
  proposalId?: string;
}

async function revalidateProposal(proposalId: string) {
  const proposal = await prisma.commercialProposal.findUnique({
    where: { id: proposalId },
    select: { opportunityId: true },
  });
  revalidatePath("/reports/opportunities");
  if (proposal) {
    revalidatePath(`/reports/opportunities/${proposal.opportunityId}`);
    revalidatePath(
      `/reports/opportunities/${proposal.opportunityId}/proposal/${proposalId}`,
    );
  }
}

export async function createProposalAction(
  opportunityId: string,
): Promise<ProposalActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await createProposalForOpportunity({
    opportunityId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      proposalId: result.existingProposalId,
    };
  }

  await revalidateProposal(result.proposalId);
  return {
    success: true,
    proposalId: result.proposalId,
    message: "Draft Proposal created.",
  };
}

export async function reviseProposalAction(
  opportunityId: string,
): Promise<ProposalActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await reviseProposalForOpportunity({
    opportunityId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  await revalidateProposal(result.proposalId);
  return {
    success: true,
    proposalId: result.proposalId,
    message: "Proposal revised — new draft created.",
  };
}

export async function updateProposalPresentationAction(
  proposalId: string,
  fields: {
    title?: string;
    executiveSummary?: string;
    businessContext?: string | null;
    approachIntro?: string | null;
    timelineNote?: string | null;
    nextStepText?: string | null;
  },
): Promise<ProposalActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateProposalPresentation({
    proposalId,
    ...fields,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidateProposal(proposalId);
  return { success: true, proposalId };
}

export async function markProposalReviewedAction(
  proposalId: string,
): Promise<ProposalActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await markProposalReviewed({
    proposalId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidateProposal(proposalId);
  return { success: true, proposalId, message: "Marked reviewed." };
}

export async function approveProposalAction(
  proposalId: string,
): Promise<ProposalActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await approveProposal({
    proposalId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidateProposal(proposalId);
  return { success: true, proposalId, message: "Proposal approved." };
}

"use server";

import { revalidatePath } from "next/cache";

import {
  prepareProposalDelivery,
  recordProposalDecision,
  regenerateProposalShareToken,
  revokeProposalAccess,
  sendProposalDelivery,
  updateProposalDelivery,
  type ProposalDecision,
} from "@/lib/commercialization/proposal-delivery";
import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface ProposalDeliveryActionResult {
  success: boolean;
  message?: string;
  deliveryId?: string;
  shareUrl?: string;
  shareToken?: string;
}

function revalidateOpportunity(opportunityId: string) {
  revalidatePath("/reports/opportunities");
  revalidatePath(`/reports/opportunities/${opportunityId}`);
}

export async function prepareProposalDeliveryAction(options: {
  opportunityId: string;
  proposalId: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await prepareProposalDelivery({
    opportunityId: options.opportunityId,
    proposalId: options.proposalId,
    actorEmail: session.email,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    shareUrl: result.shareUrl,
    shareToken: result.shareToken,
    message: "Delivery prepared. Review the message before sending.",
  };
}

export async function updateProposalDeliveryAction(options: {
  opportunityId: string;
  deliveryId: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
  markReady?: boolean;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateProposalDelivery({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    subject: options.subject,
    message: options.message,
    markReady: options.markReady,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: options.markReady
      ? "Delivery marked ready to send."
      : "Delivery updated.",
  };
}

export async function regenerateProposalShareLinkAction(options: {
  opportunityId: string;
  deliveryId: string;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await regenerateProposalShareToken({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    shareUrl: result.shareUrl,
    shareToken: result.shareToken,
    message: "New secure link generated.",
  };
}

export async function sendProposalDeliveryAction(options: {
  opportunityId: string;
  deliveryId: string;
  shareToken: string;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await sendProposalDelivery({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
    shareToken: options.shareToken,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: "Proposal sent.",
  };
}

export async function revokeProposalAccessAction(options: {
  opportunityId: string;
  deliveryId: string;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await revokeProposalAccess({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: "Proposal link access revoked.",
  };
}

export async function recordProposalDecisionAction(options: {
  opportunityId: string;
  deliveryId: string;
  decision: ProposalDecision;
  note?: string | null;
}): Promise<ProposalDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await recordProposalDecision({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
    decision: options.decision,
    note: options.note,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: "Client decision recorded.",
  };
}

export async function loadProposalDeliveryEditorData(options: {
  opportunityId: string;
  proposalId: string;
}) {
  const session = await getInternalSession();
  if (!session) {
    return null;
  }

  const [contacts, deliveries] = await Promise.all([
    prisma.opportunity
      .findUnique({
        where: { id: options.opportunityId },
        select: {
          prospect: {
            select: {
              contacts: {
                where: { email: { not: "" } },
                orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
                select: { email: true, name: true, isPrimary: true },
              },
            },
          },
        },
      })
      .then((row) => row?.prospect.contacts ?? []),
    prisma.proposalDelivery.findMany({
      where: {
        opportunityId: options.opportunityId,
        proposalId: options.proposalId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { contacts, deliveries };
}

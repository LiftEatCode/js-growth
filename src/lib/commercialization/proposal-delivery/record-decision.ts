import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  MAX_DECISION_NOTE_CHARS,
  PROPOSAL_DECISIONS,
  type ProposalDecision,
} from "./constants";

export type RecordProposalDecisionResult =
  | { ok: true; deliveryId: string; decision: ProposalDecision }
  | { ok: false; code: string; message: string };

export async function recordProposalDecision(options: {
  deliveryId: string;
  actorEmail: string;
  decision: ProposalDecision;
  note?: string | null;
}): Promise<RecordProposalDecisionResult> {
  if (!PROPOSAL_DECISIONS.includes(options.decision)) {
    return {
      ok: false,
      code: "INVALID_DECISION",
      message: "Invalid decision value.",
    };
  }

  const delivery = await prisma.proposalDelivery.findUnique({
    where: { id: options.deliveryId },
    include: {
      proposal: { select: { revision: true } },
    },
  });

  if (!delivery) {
    return {
      ok: false,
      code: "DELIVERY_NOT_FOUND",
      message: "Delivery not found.",
    };
  }

  const note = options.note?.trim().slice(0, MAX_DECISION_NOTE_CHARS) ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.proposalDelivery.update({
      where: { id: delivery.id },
      data: {
        decision: options.decision,
        decisionAt: new Date(),
        decisionRecordedByEmail: options.actorEmail,
        decisionNote: note,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: delivery.opportunityId,
        type: "PROPOSAL_DECISION_RECORDED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: delivery.id,
          proposalId: delivery.proposalId,
          proposalRevision: delivery.proposal.revision,
          decision: options.decision,
        } as Prisma.InputJsonValue,
        note,
      },
    });
  });

  return {
    ok: true,
    deliveryId: delivery.id,
    decision: options.decision,
  };
}

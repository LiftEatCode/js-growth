import "server-only";

import { prisma } from "@/lib/prisma";
import type { AgreementSnapshot } from "@/lib/commercialization/agreement/types";

import {
  agreementDeliveryStatusLabel,
  type AgreementDeliveryStatus,
} from "./constants";
import { hashAgreementShareToken } from "./token";

function parseSnapshot(raw: unknown): AgreementSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as AgreementSnapshot;
}

export interface LoadedAgreementDeliverySummary {
  id: string;
  agreementId: string;
  agreementRevision: number;
  status: AgreementDeliveryStatus;
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
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Date;
  isCurrentAgreement: boolean;
}

function viewLabelForDelivery(delivery: {
  viewCount: number;
  firstViewedAt: Date | null;
}): string {
  if (delivery.viewCount <= 0 || !delivery.firstViewedAt) {
    return "Not viewed";
  }
  if (delivery.viewCount === 1) {
    return "Agreement link viewed once";
  }
  return `Agreement link viewed ${delivery.viewCount} times`;
}

export async function loadAgreementDeliveriesForOpportunity(options: {
  opportunityId: string;
  currentAgreementId: string | null;
}): Promise<LoadedAgreementDeliverySummary[]> {
  const rows = await prisma.agreementDelivery.findMany({
    where: { opportunityId: options.opportunityId },
    orderBy: { createdAt: "desc" },
    include: {
      agreement: { select: { revision: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    agreementId: row.agreementId,
    agreementRevision: row.agreement.revision,
    status: row.status,
    statusLabel: agreementDeliveryStatusLabel(row.status),
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
    failureCode: row.failureCode,
    failureMessage: row.failureMessage,
    createdAt: row.createdAt,
    isCurrentAgreement: row.agreementId === options.currentAgreementId,
  }));
}

export async function loadPublicAgreementByShareToken(options: {
  shareToken: string;
}): Promise<{
  agreementId: string;
  status: string;
  snapshot: AgreementSnapshot;
  acceptanceLanguage: string;
  alreadyAccepted: boolean;
  acceptedAt: Date | null;
  signerName: string | null;
} | null> {
  const shareTokenHash = hashAgreementShareToken(options.shareToken);
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { shareTokenHash },
    include: {
      agreement: {
        include: { acceptance: true },
      },
    },
  });

  if (!delivery || delivery.revokedAt) {
    return null;
  }

  const agreement = delivery.agreement;

  if (
    agreement.status !== "APPROVED" &&
    agreement.status !== "ACCEPTED"
  ) {
    return null;
  }

  const snapshot = parseSnapshot(agreement.snapshotJson);
  if (!snapshot) {
    return null;
  }

  return {
    agreementId: agreement.id,
    status: agreement.status,
    snapshot,
    acceptanceLanguage: agreement.acceptanceLanguage,
    alreadyAccepted: agreement.status === "ACCEPTED",
    acceptedAt: agreement.acceptance?.acceptedAt ?? agreement.acceptedAt,
    signerName: agreement.acceptance?.signerName ?? null,
  };
}

export async function findDeliveryIdByShareToken(
  shareToken: string,
): Promise<string | null> {
  const shareTokenHash = hashAgreementShareToken(shareToken);
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { shareTokenHash },
    select: { id: true, revokedAt: true },
  });
  if (!delivery || delivery.revokedAt) {
    return null;
  }
  return delivery.id;
}

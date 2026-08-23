import "server-only";

import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import { prisma } from "@/lib/prisma";

import {
  commercialPaymentTypeLabel,
  type CommercialPaymentStatusValue,
  type CommercialPaymentTypeValue,
} from "./constants";
import { derivePaymentState } from "./state";
import type {
  AcceptedAgreementPaymentAuthority,
  LoadedPaymentSummary,
  PaymentStateSnapshot,
} from "./types";

function parseBusinessName(snapshotJson: unknown): string {
  if (!snapshotJson || typeof snapshotJson !== "object") {
    return "Client";
  }
  const snap = snapshotJson as { businessName?: unknown };
  return typeof snap.businessName === "string" && snap.businessName.trim()
    ? snap.businessName.trim()
    : "Client";
}

export function toLoadedPaymentSummary(row: {
  id: string;
  type: CommercialPaymentTypeValue;
  status: CommercialPaymentStatusValue;
  currency: string;
  amountDueCents: number;
  amountPaidCents: number;
  paymentSequence: number;
  checkoutUrl: string | null;
  stripeCheckoutSessionId: string | null;
  paidAt: Date | null;
  failedAt: Date | null;
  expiredAt: Date | null;
  refundedAt: Date | null;
  reconciliationCode: string | null;
  createdAt: Date;
}): LoadedPaymentSummary {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    currency: row.currency,
    amountDueCents: row.amountDueCents,
    amountPaidCents: row.amountPaidCents,
    paymentSequence: row.paymentSequence,
    checkoutUrl: row.checkoutUrl,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    paidAt: row.paidAt,
    failedAt: row.failedAt,
    expiredAt: row.expiredAt,
    refundedAt: row.refundedAt,
    reconciliationCode: row.reconciliationCode,
    createdAt: row.createdAt,
  };
}

export async function loadAcceptedAgreementPaymentAuthority(options: {
  agreementId: string;
}): Promise<AcceptedAgreementPaymentAuthority | null> {
  const row = await prisma.commercialAgreement.findUnique({
    where: { id: options.agreementId },
    select: {
      id: true,
      opportunityId: true,
      status: true,
      currency: true,
      paymentTermType: true,
      totalInvestmentCents: true,
      depositCents: true,
      balanceCents: true,
      paymentCustomText: true,
      snapshotJson: true,
    },
  });

  if (!row) {
    return null;
  }

  return {
    agreementId: row.id,
    opportunityId: row.opportunityId,
    status: row.status,
    currency: row.currency,
    paymentTermType: row.paymentTermType as AgreementPaymentTermType,
    totalInvestmentCents: row.totalInvestmentCents,
    depositCents: row.depositCents,
    balanceCents: row.balanceCents,
    paymentCustomText: row.paymentCustomText,
    businessName: parseBusinessName(row.snapshotJson),
  };
}

export async function loadPaymentsForAgreement(options: {
  agreementId: string;
}): Promise<LoadedPaymentSummary[]> {
  const rows = await prisma.commercialPayment.findMany({
    where: { agreementId: options.agreementId },
    orderBy: [{ createdAt: "desc" }],
  });

  return rows.map((row) =>
    toLoadedPaymentSummary({
      ...row,
      type: row.type as CommercialPaymentTypeValue,
      status: row.status as CommercialPaymentStatusValue,
    }),
  );
}

export async function loadPaymentStateForOpportunity(options: {
  opportunityId: string;
}): Promise<{
  agreement: AcceptedAgreementPaymentAuthority | null;
  payments: LoadedPaymentSummary[];
  state: PaymentStateSnapshot;
}> {
  const agreementRow = await prisma.commercialAgreement.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: "ACCEPTED",
    },
    orderBy: { acceptedAt: "desc" },
    select: {
      id: true,
      opportunityId: true,
      status: true,
      currency: true,
      paymentTermType: true,
      totalInvestmentCents: true,
      depositCents: true,
      balanceCents: true,
      paymentCustomText: true,
      snapshotJson: true,
    },
  });

  if (!agreementRow) {
    return {
      agreement: null,
      payments: [],
      state: derivePaymentState({ agreement: null, payments: [] }),
    };
  }

  const agreement: AcceptedAgreementPaymentAuthority = {
    agreementId: agreementRow.id,
    opportunityId: agreementRow.opportunityId,
    status: agreementRow.status,
    currency: agreementRow.currency,
    paymentTermType: agreementRow.paymentTermType as AgreementPaymentTermType,
    totalInvestmentCents: agreementRow.totalInvestmentCents,
    depositCents: agreementRow.depositCents,
    balanceCents: agreementRow.balanceCents,
    paymentCustomText: agreementRow.paymentCustomText,
    businessName: parseBusinessName(agreementRow.snapshotJson),
  };

  const payments = await loadPaymentsForAgreement({
    agreementId: agreement.agreementId,
  });

  return {
    agreement,
    payments,
    state: derivePaymentState({ agreement, payments }),
  };
}

export { commercialPaymentTypeLabel };

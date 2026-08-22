import { formatUsdCents } from "@/lib/commercialization/pricing/constants";

import {
  DEFAULT_DEPOSIT_PERCENT,
  MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS,
  type AgreementPaymentTermType,
} from "./constants";
import type { AgreementPaymentTermsSnapshot } from "./types";

export function computeDepositAndBalanceCents(options: {
  totalCents: number;
  depositPercent: number;
}): { depositCents: number; balanceCents: number } {
  const pct = Math.min(100, Math.max(1, options.depositPercent));
  const depositCents = Math.floor((options.totalCents * pct) / 100);
  const balanceCents = options.totalCents - depositCents;
  return { depositCents, balanceCents };
}

export function buildPaymentTermsDisplaySummary(options: {
  type: AgreementPaymentTermType;
  totalCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  depositPercent: number | null;
  customText: string | null;
}): string {
  switch (options.type) {
    case "FULL_UPFRONT":
      return `Full payment of ${formatUsdCents(options.totalCents)} is due before work begins.`;
    case "DEPOSIT_AND_BALANCE": {
      const deposit = options.depositCents ?? 0;
      const balance = options.balanceCents ?? 0;
      const pct = options.depositPercent ?? DEFAULT_DEPOSIT_PERCENT;
      return `${pct}% deposit (${formatUsdCents(deposit)}) due before work begins. Remaining balance (${formatUsdCents(balance)}) due upon completion / before final handoff.`;
    }
    case "CUSTOM":
      return (
        options.customText?.trim().slice(0, MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS) ??
        "Custom payment terms apply as described below."
      );
    default: {
      const _exhaustive: never = options.type;
      return _exhaustive;
    }
  }
}

export function resolvePaymentAmounts(options: {
  type: AgreementPaymentTermType;
  totalCents: number;
  depositPercent: number;
}): {
  depositCents: number | null;
  balanceCents: number | null;
} {
  if (options.type === "FULL_UPFRONT") {
    return { depositCents: null, balanceCents: null };
  }
  if (options.type === "DEPOSIT_AND_BALANCE") {
    return computeDepositAndBalanceCents({
      totalCents: options.totalCents,
      depositPercent: options.depositPercent,
    });
  }
  return { depositCents: null, balanceCents: null };
}

export function buildPaymentTermsSnapshot(options: {
  type: AgreementPaymentTermType;
  totalCents: number;
  depositPercent: number;
  customText: string | null;
}): AgreementPaymentTermsSnapshot {
  const { depositCents, balanceCents } = resolvePaymentAmounts({
    type: options.type,
    totalCents: options.totalCents,
    depositPercent: options.depositPercent,
  });

  return {
    type: options.type,
    totalCents: options.totalCents,
    depositCents,
    balanceCents,
    depositPercent:
      options.type === "DEPOSIT_AND_BALANCE" ? options.depositPercent : null,
    customText:
      options.type === "CUSTOM"
        ? options.customText?.trim().slice(0, MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS) ??
          null
        : null,
    displaySummary: buildPaymentTermsDisplaySummary({
      type: options.type,
      totalCents: options.totalCents,
      depositCents,
      balanceCents,
      depositPercent:
        options.type === "DEPOSIT_AND_BALANCE" ? options.depositPercent : null,
      customText: options.customText,
    }),
  };
}

export function validateCustomPaymentTerms(customText: string | null): boolean {
  return !!customText?.trim();
}

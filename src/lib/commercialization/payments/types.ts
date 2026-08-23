import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";

import type {
  CommercialPaymentStatusValue,
  CommercialPaymentTypeValue,
  DerivedPaymentState,
} from "./constants";

export interface AcceptedAgreementPaymentAuthority {
  agreementId: string;
  opportunityId: string;
  status: string;
  currency: string;
  paymentTermType: AgreementPaymentTermType;
  totalInvestmentCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  paymentCustomText: string | null;
  businessName: string;
}

export interface PaymentRequirement {
  type: CommercialPaymentTypeValue;
  amountDueCents: number;
  currency: "USD";
  paymentTermTypeSnapshot: AgreementPaymentTermType;
  paymentSequence: number;
  lineItemDescription: string;
}

export type PaymentRequirementResult =
  | { ok: true; requirement: PaymentRequirement }
  | {
      ok: false;
      code:
        | "AGREEMENT_NOT_ACCEPTED"
        | "CURRENCY_UNSUPPORTED"
        | "AMOUNT_INVALID"
        | "CUSTOM_TERMS_AMBIGUOUS"
        | "REQUIREMENT_ALREADY_PAID"
        | "DEPOSIT_NOT_PAID"
        | "UNKNOWN_TERM_TYPE"
        | "NO_REQUIREMENT";
      message: string;
    };

export interface PaymentStateSnapshot {
  derivedState: DerivedPaymentState;
  overallLabel: string;
  readyForOnboarding: boolean;
  totalInvestmentCents: number;
  totalPaidCents: number;
  remainingCents: number;
  deposit: {
    amountCents: number | null;
    status: CommercialPaymentStatusValue | "DUE" | "NOT_APPLICABLE";
    checkoutUrl: string | null;
    paymentId: string | null;
  };
  balance: {
    amountCents: number | null;
    status: CommercialPaymentStatusValue | "DUE" | "PENDING" | "NOT_APPLICABLE";
    checkoutUrl: string | null;
    paymentId: string | null;
  };
  full: {
    amountCents: number | null;
    status: CommercialPaymentStatusValue | "DUE" | "NOT_APPLICABLE";
    checkoutUrl: string | null;
    paymentId: string | null;
  };
  canCreateDepositCheckout: boolean;
  canCreateBalanceCheckout: boolean;
  canCreateFullCheckout: boolean;
  canRegenerateActiveCheckout: boolean;
  activeCheckoutUrl: string | null;
  activePaymentId: string | null;
  activePaymentType: CommercialPaymentTypeValue | null;
}

export interface LoadedPaymentSummary {
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
}

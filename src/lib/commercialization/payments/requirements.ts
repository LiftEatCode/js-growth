import { formatUsdCents } from "@/lib/commercialization/pricing/constants";

import type { CommercialPaymentTypeValue } from "./constants";
import type {
  AcceptedAgreementPaymentAuthority,
  PaymentRequirement,
  PaymentRequirementResult,
} from "./types";

function isPositiveIntCents(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function buildCheckoutLineDescription(options: {
  businessName: string;
  type: CommercialPaymentTypeValue;
}): string {
  const name = options.businessName.trim() || "Client";
  switch (options.type) {
    case "DEPOSIT":
      return `JS Solutions — ${name} Implementation Deposit`;
    case "BALANCE":
      return `JS Solutions — ${name} Implementation Balance`;
    case "FULL":
      return `JS Solutions — ${name} Implementation Payment`;
    default: {
      const _exhaustive: never = options.type;
      return _exhaustive;
    }
  }
}

/**
 * Derives the next payment requirement ONLY from an ACCEPTED Agreement snapshot.
 * Never recalculates deposit/balance from Pricing.
 */
export function derivePaymentRequirement(options: {
  agreement: AcceptedAgreementPaymentAuthority;
  requestedType: CommercialPaymentTypeValue;
  depositPaid: boolean;
  typeAlreadyPaid: boolean;
  nextSequence: number;
}): PaymentRequirementResult {
  const { agreement, requestedType } = options;

  if (agreement.status !== "ACCEPTED") {
    return {
      ok: false,
      code: "AGREEMENT_NOT_ACCEPTED",
      message: "Only an accepted Agreement can create a payment checkout.",
    };
  }

  if (agreement.currency.toUpperCase() !== "USD") {
    return {
      ok: false,
      code: "CURRENCY_UNSUPPORTED",
      message: "V1 commercial payments support USD only.",
    };
  }

  if (options.typeAlreadyPaid) {
    return {
      ok: false,
      code: "REQUIREMENT_ALREADY_PAID",
      message: `${requestedType} is already paid for this Agreement.`,
    };
  }

  if (agreement.paymentTermType === "CUSTOM") {
    return {
      ok: false,
      code: "CUSTOM_TERMS_AMBIGUOUS",
      message:
        "Custom payment terms require manual handling. Automatic Stripe checkout is blocked.",
    };
  }

  let amountDueCents: number | null = null;

  if (agreement.paymentTermType === "FULL_UPFRONT") {
    if (requestedType !== "FULL") {
      return {
        ok: false,
        code: "NO_REQUIREMENT",
        message: "Full-upfront Agreements only support a FULL payment.",
      };
    }
    amountDueCents = agreement.totalInvestmentCents;
  } else if (agreement.paymentTermType === "DEPOSIT_AND_BALANCE") {
    if (requestedType === "FULL") {
      return {
        ok: false,
        code: "NO_REQUIREMENT",
        message:
          "Deposit-and-balance Agreements do not use a single FULL payment.",
      };
    }
    if (requestedType === "DEPOSIT") {
      amountDueCents = agreement.depositCents;
    } else {
      if (!options.depositPaid) {
        return {
          ok: false,
          code: "DEPOSIT_NOT_PAID",
          message: "Balance checkout requires a paid deposit first.",
        };
      }
      amountDueCents = agreement.balanceCents;
    }
  } else {
    return {
      ok: false,
      code: "UNKNOWN_TERM_TYPE",
      message: "Unknown payment term type.",
    };
  }

  if (!isPositiveIntCents(amountDueCents)) {
    return {
      ok: false,
      code: "AMOUNT_INVALID",
      message: "Agreement does not contain a valid positive amount in cents.",
    };
  }

  if (
    agreement.paymentTermType === "DEPOSIT_AND_BALANCE" &&
    isPositiveIntCents(agreement.depositCents) &&
    isPositiveIntCents(agreement.balanceCents) &&
    agreement.depositCents + agreement.balanceCents !==
      agreement.totalInvestmentCents
  ) {
    return {
      ok: false,
      code: "AMOUNT_INVALID",
      message:
        "Agreement deposit + balance does not equal total investment. Payment blocked.",
    };
  }

  const requirement: PaymentRequirement = {
    type: requestedType,
    amountDueCents,
    currency: "USD",
    paymentTermTypeSnapshot: agreement.paymentTermType,
    paymentSequence: options.nextSequence,
    lineItemDescription: buildCheckoutLineDescription({
      businessName: agreement.businessName,
      type: requestedType,
    }),
  };

  return { ok: true, requirement };
}

export function formatPaymentAmountLabel(cents: number): string {
  return formatUsdCents(cents);
}

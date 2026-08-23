/**
 * Commercial workflow pure integration tests (no DB).
 * Covers payment terms, snapshot hashing, tokens, staleness, side-effect source guarantees.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAgreementFromApprovedSources } from "@/lib/commercialization/agreement/build";
import {
  canonicalizeAgreementSnapshot,
  hashAgreementSnapshot,
} from "@/lib/commercialization/agreement/hash";
import {
  computeDepositAndBalanceCents,
  buildPaymentTermsSnapshot,
  validateCustomPaymentTerms,
} from "@/lib/commercialization/agreement/payment-terms";
import { evaluateAgreementStaleness } from "@/lib/commercialization/agreement/staleness";
import { buildAgreementSourceFingerprint } from "@/lib/commercialization/agreement/fingerprint";
import {
  generateAgreementShareToken,
  hashAgreementShareToken,
  verifyAgreementShareToken,
} from "@/lib/commercialization/agreement-delivery/token";
import {
  generateProposalShareToken,
  hashProposalShareToken,
  verifyProposalShareToken,
} from "@/lib/commercialization/proposal-delivery/token";
import { evaluateProposalStaleness } from "@/lib/commercialization/proposal/staleness";
import { buildProposalSourceFingerprint } from "@/lib/commercialization/proposal/fingerprint";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "@/lib/commercialization/proposal/constants";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";
import { buildPricingFromScope } from "@/lib/commercialization/pricing/build";
import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

const proposalSnapshot: ProposalSnapshot = {
  businessName: "Acme Roofing",
  locationLabel: "Austin, TX",
  currency: "USD",
  includedInvestmentCents: 300_000,
  optionalInvestmentCents: 0,
  totalInvestmentCents: 300_000,
  engagementAdjustmentCents: 0,
  investmentIntro: "Investment",
  methodologyFooter: "Footer",
  sections: [
    {
      title: "Search Optimization",
      clientValueExplanation: "Clearer structure.",
      capabilities: [],
      isOptional: false,
      deliverables: [
        {
          title: "Heading architecture improvements",
          sourceTitle: "Heading architecture improvements",
          isOptional: false,
        },
      ],
    },
  ],
  optionalSections: [],
  assumptions: ["CMS access"],
  exclusions: ["Paid ads"],
  considerations: ["Legacy theme"],
  includedInvestmentGroups: [],
  optionalInvestmentGroups: [],
  includedLines: [],
  optionalLines: [],
};

// --- Pricing work-unit dedupe ---
const pricingBuilt = buildPricingFromScope({
  opportunityId: "opp-1",
  scope: {
    id: "scope-1",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "sec-a",
        title: "Search Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d1",
            title: "Heading architecture improvements",
            sourceActionKey: "heading-architecture",
            source: "MANUAL",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
      {
        id: "sec-b",
        title: "Content Foundation",
        isIncluded: true,
        isOptional: false,
        sortOrder: 1,
        deliverables: [
          {
            id: "d2",
            title: "Heading structure for service pages",
            sourceActionKey: "heading-architecture",
            source: "MANUAL",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
});

assert(
  pricingBuilt.lineItems.filter((l) => l.workUnitKey === "heading-architecture")
    .length === 1,
  "work-unit dedupe collapses overlapping heading deliverables",
);

// --- Payment terms ---
const split = computeDepositAndBalanceCents({
  totalCents: 300_000,
  depositPercent: 50,
});
assert(split.depositCents === 150_000, "50% deposit");
assert(split.balanceCents === 150_000, "50% balance");
assert(
  split.depositCents + split.balanceCents === 300_000,
  "deposit+balance=total",
);

const odd = computeDepositAndBalanceCents({
  totalCents: 300_001,
  depositPercent: 50,
});
assert(odd.depositCents + odd.balanceCents === 300_001, "odd-cent deterministic");

assert(validateCustomPaymentTerms("Net 15"), "custom requires text");
assert(!validateCustomPaymentTerms(""), "empty custom invalid");

const fullUpfront = buildPaymentTermsSnapshot({
  type: "FULL_UPFRONT",
  totalCents: 300_000,
  depositPercent: 50,
  customText: null,
});
assert(fullUpfront.depositCents === null, "full upfront no deposit split");

// --- Agreement snapshot + hash ---
const agreement = buildAgreementFromApprovedSources({
  proposal: {
    id: "prop-1",
    revision: 1,
    proposalVersion: 1,
    presentationVersion: 3,
    title: "Proposal",
    snapshot: proposalSnapshot,
  },
  authority: {
    opportunityId: "opp-1",
    scopeId: "scope-1",
    scopeRevision: 1,
    pricingId: "price-1",
    pricingRevision: 1,
    currency: "USD",
    includedInvestmentCents: 300_000,
    optionalInvestmentCents: 0,
    totalInvestmentCents: 300_000,
  },
  businessName: "Acme Roofing",
  locationLabel: "Austin, TX",
});

assert(agreement.totalInvestmentCents === 300_000, "agreement totals match pricing");
assert(agreement.depositCents === 150_000, "default deposit");
assert(
  agreement.snapshot.resultsDisclaimer.toLowerCase().includes("does not guarantee"),
  "results disclaimer present",
);
assert(
  !JSON.stringify(agreement.snapshot).includes("workUnitKey"),
  "no work unit keys in client snapshot",
);

const hashA = hashAgreementSnapshot(agreement.snapshot);
const hashB = hashAgreementSnapshot(agreement.snapshot);
assert(hashA === hashB, "snapshot hash deterministic");
assert(
  canonicalizeAgreementSnapshot(agreement.snapshot) ===
    canonicalizeAgreementSnapshot(agreement.snapshot),
  "canonicalization deterministic",
);

// --- Tokens ---
const pToken = generateProposalShareToken();
const pHash = hashProposalShareToken(pToken);
assert(verifyProposalShareToken(pToken, pHash), "proposal token verifies");
assert(!verifyProposalShareToken("bad", pHash), "invalid proposal token rejected");

const aToken = generateAgreementShareToken();
const aHash = hashAgreementShareToken(aToken);
assert(verifyAgreementShareToken(aToken, aHash), "agreement token verifies");
assert(!verifyAgreementShareToken("bad", aHash), "invalid agreement token rejected");
assert(pToken !== aToken, "proposal and agreement tokens are distinct");

// --- Staleness ---
const proposalFp = buildProposalSourceFingerprint({
  opportunityId: "opp-1",
  commercialScopeId: "scope-1",
  scopeRevision: 1,
  commercialPricingId: "price-1",
  pricingRevision: 1,
  proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
  presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
});
const staleProposal = evaluateProposalStaleness({
  storedFingerprint: proposalFp,
  current: {
    opportunityId: "opp-1",
    commercialScopeId: "scope-2",
    scopeRevision: 2,
    commercialPricingId: "price-1",
    pricingRevision: 1,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  },
});
assert(staleProposal.stale, "proposal stale after scope revise");

const agreementFp = buildAgreementSourceFingerprint({
  opportunityId: "opp-1",
  proposalId: "prop-1",
  proposalRevision: 1,
  commercialScopeId: "scope-1",
  scopeRevision: 1,
  commercialPricingId: "price-1",
  pricingRevision: 1,
  agreementVersion: 1,
  agreementPresentationVersion: 1,
  termsVersion: 1,
  paymentTermType: "DEPOSIT_AND_BALANCE",
  depositPercent: 50,
  paymentCustomText: null,
});
const staleAgreement = evaluateAgreementStaleness({
  storedFingerprint: agreementFp,
  current: {
    opportunityId: "opp-1",
    proposalId: "prop-1",
    proposalRevision: 1,
    commercialScopeId: "scope-1",
    scopeRevision: 2,
    commercialPricingId: "price-1",
    pricingRevision: 1,
    agreementVersion: 1,
    agreementPresentationVersion: 1,
    termsVersion: 1,
    paymentTermType: "DEPOSIT_AND_BALANCE",
    depositPercent: 50,
    paymentCustomText: null,
  },
});
assert(staleAgreement.stale, "agreement stale after scope revise");

// --- Side-effect source guarantees ---
const proposalPrepare = readFileSync(
  join(repoRoot, "src/lib/commercialization/proposal-delivery/prepare.ts"),
  "utf8",
);
assert(!proposalPrepare.includes("resend.emails.send"), "proposal prepare sends 0 emails");

const agreementPrepare = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement-delivery/prepare.ts"),
  "utf8",
);
assert(!agreementPrepare.includes("resend.emails.send"), "agreement prepare sends 0 emails");

const acceptSource = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement/accept.ts"),
  "utf8",
);
assert(!/stripe|Stripe/i.test(acceptSource), "accept has 0 Stripe calls");
assert(!/resend|Resend/i.test(acceptSource), "accept has 0 Resend calls");
assert(!acceptSource.includes("MARKED_WON"), "accept does not mark WON");

const proposalSend = readFileSync(
  join(repoRoot, "src/lib/commercialization/proposal-delivery/send.ts"),
  "utf8",
);
assert(proposalSend.includes("resend.emails.send"), "proposal send uses Resend");

const agreementSend = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement-delivery/send.ts"),
  "utf8",
);
assert(agreementSend.includes("resend.emails.send"), "agreement send uses Resend");

const publicProposal = readFileSync(
  join(repoRoot, "src/app/proposal/[token]/page.tsx"),
  "utf8",
);
assert(publicProposal.includes("index: false"), "proposal public noindex");

const publicAgreement = readFileSync(
  join(repoRoot, "src/app/agreement/[token]/page.tsx"),
  "utf8",
);
assert(publicAgreement.includes("index: false"), "agreement public noindex");

const sitemap = readFileSync(join(repoRoot, "src/app/sitemap.ts"), "utf8");
assert(!sitemap.includes("/proposal/"), "proposal not in sitemap");
assert(!sitemap.includes("/agreement/"), "agreement not in sitemap");

assert(isForbiddenAnalyticsParamKey("agreement_token"), "analytics forbids agreement token");
assert(isForbiddenAnalyticsParamKey("signer_email"), "analytics forbids signer email");

console.log("commercial-workflow.integration.ts: PASS");

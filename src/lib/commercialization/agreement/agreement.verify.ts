/**
 * Commercial Sprint 8 — Agreement & client acceptance verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend (except send scan), Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";
import {
  COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
  COMMERCIAL_AGREEMENT_TERMS_VERSION,
  COMMERCIAL_AGREEMENT_VERSION,
  DEFAULT_DEPOSIT_PERCENT,
} from "./constants";
import { buildAgreementFromApprovedSources } from "./build";
import { computeDepositAndBalanceCents, validateCustomPaymentTerms } from "./payment-terms";
import { hashAgreementSnapshot } from "./hash";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";

import {
  buildDefaultAgreementEmailBody,
  buildDefaultAgreementEmailSubject,
  buildAgreementShareUrl,
} from "../agreement-delivery/defaults";
import {
  canSendDeliveryStatus,
  validateRecipientInput,
} from "../agreement-delivery/gates";
import {
  generateAgreementShareToken,
  hashAgreementShareToken,
  verifyAgreementShareToken,
} from "../agreement-delivery/token";
import { AGREEMENT_DELIVERY_VERSION } from "../agreement-delivery/constants";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectTsFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");

assert(COMMERCIAL_AGREEMENT_VERSION === 1, "agreement version 1");
assert(COMMERCIAL_AGREEMENT_PRESENTATION_VERSION === 1, "presentation version 1");
assert(COMMERCIAL_AGREEMENT_TERMS_VERSION === 1, "terms version 1");
assert(AGREEMENT_DELIVERY_VERSION === 1, "delivery version 1");
assert(DEFAULT_DEPOSIT_PERCENT === 50, "default deposit 50%");

for (const type of [
  "AGREEMENT_CREATED",
  "AGREEMENT_REVIEWED",
  "AGREEMENT_APPROVED",
  "AGREEMENT_REVISED",
  "AGREEMENT_SUPERSEDED",
  "AGREEMENT_DELIVERY_PREPARED",
  "AGREEMENT_SENT",
  "AGREEMENT_SEND_FAILED",
  "AGREEMENT_LINK_VIEWED",
  "AGREEMENT_ACCESS_REVOKED",
  "AGREEMENT_ACCEPTED",
  "AGREEMENT_VOIDED",
] as const) {
  assert(OPPORTUNITY_ACTIVITY_TYPES.includes(type), `activity ${type}`);
}

const baseProposalSnapshot: ProposalSnapshot = {
  businessName: "Acme Roofing",
  locationLabel: "Austin, TX",
  currency: "USD",
  includedInvestmentCents: 300_000,
  optionalInvestmentCents: 0,
  totalInvestmentCents: 300_000,
  engagementAdjustmentCents: 0,
  investmentIntro: "Investment intro",
  methodologyFooter: "Footer",
  sections: [
    {
      title: "Technical Foundation",
      clientValueExplanation: "Stronger site foundation.",
      capabilities: [],
      isOptional: false,
      deliverables: [
        {
          title: "Core Web Vitals improvements",
          sourceTitle: "core-web-vitals",
          isOptional: false,
        },
      ],
    },
  ],
  optionalSections: [],
  assumptions: ["Client provides CMS access."],
  exclusions: ["Paid ads not included."],
  considerations: ["Legacy theme may limit layout changes."],
  includedInvestmentGroups: [],
  optionalInvestmentGroups: [],
  includedLines: [],
  optionalLines: [],
};

const built = buildAgreementFromApprovedSources({
  proposal: {
    id: "prop-1",
    revision: 1,
    proposalVersion: 1,
    presentationVersion: 3,
    title: "Proposal",
    snapshot: baseProposalSnapshot,
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

assert(
  built.totalInvestmentCents === 300_000,
  "investment matches pricing authority",
);
assert(
  built.snapshot.sections[0]?.deliverables[0]?.title.includes("Core Web"),
  "deliverables preserved in client snapshot",
);
assert(
  !JSON.stringify(built.snapshot).includes("sourceTitle"),
  "no source keys in snapshot sections",
);
assert(
  !JSON.stringify(built.snapshot).includes("workUnitKey"),
  "no work unit keys exposed",
);

const depositBalance = computeDepositAndBalanceCents({
  totalCents: 300_000,
  depositPercent: 50,
});
assert(depositBalance.depositCents === 150_000, "50% deposit");
assert(depositBalance.balanceCents === 150_000, "50% balance");
assert(
  depositBalance.depositCents + depositBalance.balanceCents === 300_000,
  "deposit + balance = total",
);

const odd = computeDepositAndBalanceCents({
  totalCents: 300_001,
  depositPercent: 50,
});
assert(
  odd.depositCents + odd.balanceCents === 300_001,
  "odd-cent rounding deterministic",
);

assert(validateCustomPaymentTerms("Pay 40/30/30 milestones"), "custom terms valid");
assert(!validateCustomPaymentTerms(""), "custom terms require text");

const hash1 = hashAgreementSnapshot(built.snapshot);
const hash2 = hashAgreementSnapshot(built.snapshot);
assert(hash1 === hash2, "snapshot hash deterministic");
assert(hash1.length === 64, "sha256 hex length");

const token = generateAgreementShareToken();
const hash = hashAgreementShareToken(token);
assert(verifyAgreementShareToken(token, hash), "token verifies");
assert(!verifyAgreementShareToken("bad", hash), "invalid token rejected");

const subject = buildDefaultAgreementEmailSubject("Acme Roofing");
assert(subject.includes("Agreement"), "subject mentions agreement");
assert(
  !/rankings|traffic|leads|revenue|guarantee/i.test(subject),
  "subject claim-safe",
);

const body = buildDefaultAgreementEmailBody({
  recipientName: "Jane Client",
  businessName: "Acme Roofing",
  agreementLink: "https://example.com/agreement/abc",
});
assert(body.includes("implementation agreement"), "body mentions agreement");

const shareUrl = buildAgreementShareUrl(token);
assert(shareUrl.includes("/agreement/"), "share url route");

assert(canSendDeliveryStatus("READY"), "ready sendable");
assert(!canSendDeliveryStatus("DRAFT"), "draft not sendable");

const recipient = validateRecipientInput({
  recipientName: "Jane",
  recipientEmail: "jane@example.com",
});
assert(recipient.ok, "recipient valid");

assert(
  built.snapshot.resultsDisclaimer.includes("does not guarantee"),
  "results disclaimer present",
);
assert(!/ranking guarantee/i.test(built.snapshot.resultsDisclaimer), "no ranking guarantee");

const prepareSource = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement-delivery/prepare.ts"),
  "utf8",
);
assert(!prepareSource.includes("resend.emails.send"), "prepare 0 Resend");

const sendSource = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement-delivery/send.ts"),
  "utf8",
);
assert(sendSource.includes("resend.emails.send"), "send uses Resend once");

const acceptSource = readFileSync(join(here, "accept.ts"), "utf8");
assert(!acceptSource.includes("resend"), "accept 0 Resend");
assert(!acceptSource.includes("stripe"), "accept 0 Stripe");
assert(!acceptSource.includes("MARKED_WON"), "accept does not mark won");

const publicPage = readFileSync(
  join(repoRoot, "src/app/agreement/[token]/page.tsx"),
  "utf8",
);
assert(publicPage.includes("index: false"), "public agreement noindex");
assert(!publicPage.includes("opportunityId"), "no internal ids public");

const sitemap = readFileSync(join(repoRoot, "src/app/sitemap.ts"), "utf8");
assert(!sitemap.includes("/agreement/"), "agreement not in sitemap");

const agreementCard = readFileSync(
  join(repoRoot, "src/components/opportunities/opportunity-agreement-card.tsx"),
  "utf8",
);
assert(
  agreementCard.includes("Payment Pending"),
  "accepted shows payment pending",
);
assert(
  !agreementCard.includes("mark Won") &&
    agreementCard.includes("does not mark"),
  "acceptance not won",
);

const loadDelivery = readFileSync(
  join(repoRoot, "src/lib/commercialization/agreement-delivery/load.ts"),
  "utf8",
);
assert(loadDelivery.includes("Agreement link viewed"), "view label conservative");

const acceptanceForm = readFileSync(
  join(repoRoot, "src/components/opportunities/agreement-acceptance-form.tsx"),
  "utf8",
);
assert(acceptanceForm.includes("Accept Agreement"), "explicit accept button");
assert(acceptanceForm.includes("type=\"checkbox\""), "checkbox required");
assert(
  acceptanceForm.includes("next steps"),
  "accepted confirmation mentions next steps",
);

assert(isForbiddenAnalyticsParamKey("agreement_token"), "token forbidden analytics");
assert(isForbiddenAnalyticsParamKey("signer_email"), "signer email forbidden");

const agreementDir = join(repoRoot, "src/lib/commercialization/agreement");
for (const file of collectTsFiles(agreementDir).filter(
  (f) => !f.endsWith(".verify.ts"),
)) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI/i.test(source), `no OpenAI in ${file}`);
  assert(!/stripe|Stripe/i.test(source), `no Stripe in ${file}`);
  assert(!/resend|Resend\(/i.test(source), `no Resend in ${file}`);
}

console.log("agreement.verify.ts: PASS");

/**
 * Commercial Sprint 7 — Proposal delivery verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend (except send path scan), Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";

import {
  buildDefaultProposalEmailBody,
  buildDefaultProposalEmailSubject,
  buildProposalShareUrl,
} from "./defaults";
import {
  canSendDeliveryStatus,
  isEditableDeliveryStatus,
  validateRecipientInput,
} from "./gates";
import {
  generateProposalShareToken,
  hashProposalShareToken,
  verifyProposalShareToken,
} from "./token";
import {
  isValidRecipientEmail,
  normalizeRecipientEmail,
  PROPOSAL_DELIVERY_VERSION,
  PROPOSAL_SHARE_TOKEN_BYTES,
  proposalDecisionLabel,
  proposalDeliveryStatusLabel,
} from "./constants";

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

assert(PROPOSAL_DELIVERY_VERSION === 1, "delivery version 1");
assert(PROPOSAL_SHARE_TOKEN_BYTES === 32, "32-byte share tokens");

for (const type of [
  "PROPOSAL_DELIVERY_PREPARED",
  "PROPOSAL_SENT",
  "PROPOSAL_SEND_FAILED",
  "PROPOSAL_LINK_VIEWED",
  "PROPOSAL_ACCESS_REVOKED",
  "PROPOSAL_DECISION_RECORDED",
] as const) {
  assert(
    OPPORTUNITY_ACTIVITY_TYPES.includes(type),
    `activity type ${type}`,
  );
}

assert(isValidRecipientEmail("client@example.com"), "valid recipient email");
assert(!isValidRecipientEmail("not-an-email"), "invalid recipient rejected");
assert(
  normalizeRecipientEmail(" Client@Example.COM ") === "client@example.com",
  "recipient email normalized",
);

const recipient = validateRecipientInput({
  recipientName: "Jane Client",
  recipientEmail: "jane@example.com",
});
assert(recipient.ok, "recipient validation passes");

const token = generateProposalShareToken();
const token2 = generateProposalShareToken();
assert(token !== token2, "token high entropy");
assert(token.length >= 40, "token length sufficient");
const hash = hashProposalShareToken(token);
assert(verifyProposalShareToken(token, hash), "valid token verifies");
assert(!verifyProposalShareToken("wrong-token", hash), "invalid token rejected");

const subject = buildDefaultProposalEmailSubject("Acme Roofing");
assert(subject.includes("Acme Roofing"), "default subject includes business");
assert(
  !/rankings|traffic|leads|revenue|ROI|guarantee/i.test(subject),
  "subject claim-safe",
);

const body = buildDefaultProposalEmailBody({
  recipientName: "Jane Client",
  businessName: "Acme Roofing",
  proposalLink: "https://example.com/proposal/abc",
});
assert(body.includes("Jane"), "body uses first name");
assert(
  !/rankings|traffic|leads|revenue|ROI|guarantee/i.test(body),
  "body claim-safe",
);

const shareUrl = buildProposalShareUrl(token);
assert(shareUrl.includes("/proposal/"), "share url uses proposal route");

assert(isEditableDeliveryStatus("DRAFT"), "draft editable");
assert(isEditableDeliveryStatus("FAILED"), "failed editable for retry");
assert(!isEditableDeliveryStatus("SENT"), "sent not editable");
assert(canSendDeliveryStatus("READY"), "ready sendable");
assert(canSendDeliveryStatus("FAILED"), "failed retry sendable");
assert(!canSendDeliveryStatus("DRAFT"), "draft not sendable until ready");

assert(
  proposalDeliveryStatusLabel("SENT") === "Sent",
  "delivery status label",
);
assert(
  proposalDecisionLabel("ACCEPTED").includes("intent"),
  "accepted explains intent only",
);

const prepareSource = readFileSync(join(here, "prepare.ts"), "utf8");
assert(!prepareSource.includes("resend.emails.send"), "prepare makes 0 Resend calls");

const sendSource = readFileSync(join(here, "send.ts"), "utf8");
assert(sendSource.includes("resend.emails.send"), "send uses Resend once");
assert(
  sendSource.includes("proposalDeliverySendIdempotencyKey"),
  "send idempotency key",
);
assert(sendSource.includes("verifyProposalShareToken"), "send verifies token");

const publicPage = readFileSync(
  join(repoRoot, "src/app/proposal/[token]/page.tsx"),
  "utf8",
);
assert(publicPage.includes("ProposalDocument"), "public page reuses ProposalDocument");
assert(publicPage.includes("index: false"), "public proposal noindex");
assert(!publicPage.includes("sourceActionKey"), "public page no source keys");
assert(!publicPage.includes("opportunityId"), "public page no opportunity id");

const sitemap = readFileSync(join(repoRoot, "src/app/sitemap.ts"), "utf8");
assert(!sitemap.includes("/proposal/"), "proposal route not in sitemap");

const deliveryCard = readFileSync(
  join(repoRoot, "src/components/opportunities/opportunity-proposal-delivery-card.tsx"),
  "utf8",
);
assert(
  deliveryCard.includes("Does not mark the Opportunity Won"),
  "accepted does not mark won ui",
);
assert(
  !deliveryCard.includes("email opened") &&
    !deliveryCard.includes("client read"),
  "view semantics conservative",
);

const loadSource = readFileSync(join(here, "load.ts"), "utf8");
assert(loadSource.includes("Proposal link viewed"), "view label conservative");

const recordDecisionSource = readFileSync(
  join(here, "record-decision.ts"),
  "utf8",
);
assert(
  !recordDecisionSource.includes("stage: \"WON\"") &&
    !recordDecisionSource.includes("MARKED_WON"),
  "decision does not mark won",
);
assert(
  !recordDecisionSource.includes("MARKED_LOST"),
  "declined does not mark lost",
);

const mutateProposal = readFileSync(
  join(repoRoot, "src/lib/commercialization/proposal/mutate.ts"),
  "utf8",
);
assert(mutateProposal.includes("IMMUTABLE"), "sent proposal content immutable via approve");

assert(isForbiddenAnalyticsParamKey("proposal_delivery_id"), "delivery id forbidden");
assert(isForbiddenAnalyticsParamKey("share_token"), "share token forbidden");
assert(isForbiddenAnalyticsParamKey("recipient_email"), "recipient email forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_email_body"), "email body forbidden");

const moduleFiles = collectTsFiles(here).filter(
  (f) => !f.endsWith(".verify.ts"),
);
for (const file of moduleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|responses\.create/i.test(source), `${file}: no OpenAI`);
  assert(!/places\.googleapis|GOOGLE_PLACES/i.test(source), `${file}: no Places`);
  assert(
    !/runDeterministicWebsiteAudit|discoverContacts/i.test(source),
    `${file}: no crawl/contact discovery`,
  );
  assert(!/\bstripe\b|Stripe\(/i.test(source), `${file}: no Stripe`);
}

const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/opportunities/proposal-delivery-actions.ts"),
  "utf8",
);
assert(
  !actionsSource.includes("resend.emails.send"),
  "actions file does not send directly",
);

const migration = readFileSync(
  join(
    repoRoot,
    "prisma/migrations/20260822120000_add_proposal_delivery/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("ProposalDelivery"), "migration exists");
assert(migration.includes("PROPOSAL_SENT"), "migration adds activity enum");

console.log("proposal-delivery.verify.ts: PASS");

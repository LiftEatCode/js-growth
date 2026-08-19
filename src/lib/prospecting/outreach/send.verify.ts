import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canSendOutreachMessage,
  type CanSendOutreachMessageInput,
} from "./can-send";
import { MAX_OUTREACH_EMAILS_PER_DAY } from "./constants";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const baseInput: CanSendOutreachMessageInput = {
  message: {
    status: "APPROVED" as const,
    approvedAt: new Date("2026-08-19T10:00:00.000Z"),
    approvedByEmail: "ops@js-growth.com",
    toEmail: "owner@business.com",
    subject: "Quick website note",
    bodyText: "Hi there",
    contactId: "contact-1",
    prospectId: "prospect-1",
    campaignId: "campaign-1",
  },
  prospect: {
    qualificationStatus: "QUALIFIED" as const,
    outreachStatus: "APPROVED" as const,
    hostname: "business.com",
    leadId: null,
  },
  contact: {
    id: "contact-1",
    isPrimary: true,
    status: "SELECTED",
    email: "owner@business.com",
    normalizedEmail: "owner@business.com",
    prospectId: "prospect-1",
  },
  campaign: {
    status: "ACTIVE" as const,
  },
  suppressedHostnames: new Set<string>(),
  suppressedEmails: new Set<string>(),
  customerHostnames: new Set<string>(),
  existingLead: false,
  priorSentExists: false,
  sentTodayCount: 0,
  maxEmailsPerDay: MAX_OUTREACH_EMAILS_PER_DAY,
};

assert(
  canSendOutreachMessage(baseInput).allowed,
  "approved and eligible message is sendable",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    message: {
      ...baseInput.message,
      status: "DRAFT",
    },
  }).allowed,
  "non-approved message is blocked",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    message: {
      ...baseInput.message,
      approvedAt: null,
    },
  }).allowed,
  "missing approval metadata is blocked",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    suppressedEmails: new Set(["owner@business.com"]),
  }).allowed,
  "suppressed email is blocked",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    priorSentExists: true,
  }).allowed,
  "duplicate previously sent message is blocked",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    sentTodayCount: MAX_OUTREACH_EMAILS_PER_DAY,
  }).allowed,
  "daily cap is enforced",
);

const here = dirname(fileURLToPath(import.meta.url));
const actionsSource = readFileSync(
  join(here, "../../../app/reports/prospecting/outreach-actions.ts"),
  "utf8",
);
const editorSource = readFileSync(
  join(here, "../../../components/prospecting/outreach-draft-editor.tsx"),
  "utf8",
);

assert(
  actionsSource.includes("sendOutreachMessage"),
  "send action exists",
);
assert(
  actionsSource.includes("updateMany({") &&
    actionsSource.includes('status: "SENDING"'),
  "send action uses atomic APPROVED -> SENDING lock",
);
assert(
  actionsSource.includes("MAX_OUTREACH_EMAILS_PER_DAY"),
  "send action enforces daily cap",
);
assert(
  actionsSource.includes("canSendOutreachMessage"),
  "send action uses central eligibility check",
);
assert(
  actionsSource.includes("resend.emails.send"),
  "send action uses Resend",
);
assert(
  !actionsSource.includes("generateOutreachDraft("),
  "send action does not regenerate drafts",
);
assert(
  !actionsSource.includes("runDeterministicWebsiteAudit"),
  "send action does not run website audits",
);
assert(
  !actionsSource.includes("google-places"),
  "send action does not call Google Places",
);

assert(
  editorSource.includes("Send Approved Email"),
  "UI has explicit send button for approved draft",
);
assert(
  editorSource.includes("window.confirm"),
  "UI has per-message send confirmation",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    prospect: {
      ...baseInput.prospect,
      outreachStatus: "CONVERTED",
      leadId: "lead-1",
    },
  }).allowed,
  "converted prospect cannot send again",
);

assert(
  !canSendOutreachMessage({
    ...baseInput,
    prospect: {
      ...baseInput.prospect,
      outreachStatus: "NOT_INTERESTED",
      leadId: null,
    },
  }).allowed,
  "not interested prospect cannot send again",
);

console.log("send.verify.ts passed");


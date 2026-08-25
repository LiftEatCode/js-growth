import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LEAD_FOLLOWUP_VERSION,
  FOLLOW_UP_OPERATOR_TIMEZONE,
  FOLLOW_UP_ACTIVITY_TYPES,
  FOLLOW_UP_DIRECTIONS,
  FOLLOW_UP_OUTCOMES,
  FOLLOW_UP_AGE_THRESHOLDS,
} from "./constants";
import {
  classifyLeadAgeBand,
  attentionSortWeight,
  bandFromWeight,
  isFollowUpCompletionEvent,
} from "./attention";
import {
  classifyFollowUpDueState,
  operatorCalendarDateKey,
  parseOperatorFollowUpDate,
} from "./timezone";
import {
  getFollowUpTemplate,
  fillFollowUpTemplate,
} from "./templates";
import { sanitizeAnalyticsPagePath } from "@/lib/analytics/page-path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

assert(LEAD_FOLLOWUP_VERSION === 1, "LEAD_FOLLOWUP_VERSION");
assert(FOLLOW_UP_OPERATOR_TIMEZONE === "America/Chicago", "ops timezone");
assert(FOLLOW_UP_ACTIVITY_TYPES.includes("PHONE_CALL"), "phone type");
assert(FOLLOW_UP_DIRECTIONS.includes("OUTBOUND"), "directions");
assert(FOLLOW_UP_OUTCOMES.includes("DO_NOT_CONTACT"), "dnc outcome");
assert(FOLLOW_UP_AGE_THRESHOLDS.NEW_MAX_DAYS === 3, "new age");
assert(FOLLOW_UP_AGE_THRESHOLDS.AGING_MAX_DAYS === 30, "aging age");

const now = new Date("2026-08-24T18:00:00Z");
assert(classifyLeadAgeBand(new Date("2026-08-23T12:00:00Z"), now) === "NEW", "age new");
assert(
  classifyLeadAgeBand(new Date("2026-07-01T12:00:00Z"), now) === "STALE",
  "age stale",
);

const overdue = classifyFollowUpDueState(
  new Date("2026-08-20T12:00:00Z"),
  now,
);
assert(overdue === "OVERDUE", "due overdue");

const todayKey = operatorCalendarDateKey(now);
const todayNoon = parseOperatorFollowUpDate(todayKey);
assert(todayNoon, "parse today");
assert(
  classifyFollowUpDueState(todayNoon, now) === "DUE_TODAY",
  "due today",
);

assert(
  attentionSortWeight({
    inboundReplyAwaiting: true,
    dueState: "NONE",
    isNewInbound: false,
    qualifiedWithoutOpportunity: false,
    opportunityOverdue: false,
    ageBand: null,
    nurtureUpcoming: false,
  }) <
    attentionSortWeight({
      inboundReplyAwaiting: false,
      dueState: "OVERDUE",
      isNewInbound: false,
      qualifiedWithoutOpportunity: false,
      opportunityOverdue: false,
      ageBand: null,
      nurtureUpcoming: false,
    }),
  "reply before overdue",
);

assert(bandFromWeight(20) === "NOW", "band now");
assert(bandFromWeight(80) === "NEXT", "band next");
assert(bandFromWeight(100) === "WATCH", "band watch");

assert(
  isFollowUpCompletionEvent({ hadDueFollowUp: true, recordedActivity: true }),
  "completion requires activity",
);
assert(
  !isFollowUpCompletionEvent({ hadDueFollowUp: true, recordedActivity: false }),
  "date edit alone is not completion",
);

const tpl = getFollowUpTemplate("inbound_initial_v1");
assert(tpl, "template exists");
const filled = fillFollowUpTemplate(tpl!, {
  firstName: "Alex",
  operatorName: "Josh",
  businessName: "Acme",
});
assert(filled.body.includes("Alex"), "template fill");
assert(!filled.body.toLowerCase().includes("opened my proposal"), "no fabricated open");
assert(!filled.body.toLowerCase().includes("visited our site"), "no creepy visit claim");

assert(
  sanitizeAnalyticsPagePath("/reports/leads/clxyz123leadid") ===
    "/reports/leads/[id]",
  "lead path sanitized",
);
assert(
  sanitizeAnalyticsPagePath("/reports/growth/follow-up") ===
    "/reports/growth/follow-up",
  "follow-up static path",
);

const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
assert(schema.includes("model FollowUpActivity"), "schema model");
assert(schema.includes("followUpAt DateTime?"), "prospect followUpAt");
assert(schema.includes("ContactSubmission"), "contact model");

const migration = readFileSync(
  join(
    root,
    "prisma/migrations/20260824180000_growth_sprint11_follow_up_activity/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("FollowUpActivity"), "migration table");
assert(!migration.includes("DELETE FROM"), "additive migration");

const store = readFileSync(join(here, "store.ts"), "utf8");
assert(store.includes("idempotencyKey"), "idempotency");
assert(store.includes("do_not_contact"), "dnc gate");

const page = readFileSync(
  join(root, "src/app/reports/growth/follow-up/page.tsx"),
  "utf8",
);
assert(page.includes("requireInternalSession"), "follow-up gated");

const leadPage = readFileSync(
  join(root, "src/app/reports/leads/[leadId]/page.tsx"),
  "utf8",
);
assert(leadPage.includes("requireInternalSession"), "lead detail gated");
assert(leadPage.includes("Acquisition (not activity channel)"), "acquisition vs activity");

const actions = readFileSync(
  join(root, "src/app/reports/growth/follow-up/actions.ts"),
  "utf8",
);
assert(!actions.includes("resend"), "no auto email send");
assert(!actions.includes("twilio"), "no twilio");

console.log("follow-up.verify.ts PASS");

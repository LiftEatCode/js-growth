import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MAX_OUTREACH_OUTCOME_NOTES_CHARS } from "./constants";
import {
  canConvertProspect,
  canRecordOutcomeForMessageStatus,
  mergeProspectOutreachStatus,
  outreachStatusForOutcome,
} from "./lifecycle";
import {
  isOutreachOutcomeValue,
  OUTREACH_OUTCOME_VALUES,
} from "./outcome-types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  OUTREACH_OUTCOME_VALUES.length === 5,
  "all required outcome values exist",
);
assert(isOutreachOutcomeValue("INTERESTED"), "interested is valid");
assert(!isOutreachOutcomeValue("SENT"), "message status is not an outcome");

assert(
  canRecordOutcomeForMessageStatus("SENT"),
  "sent message can receive an outcome",
);
assert(
  !canRecordOutcomeForMessageStatus("APPROVED"),
  "approved message cannot receive an outcome directly",
);

assert(
  outreachStatusForOutcome("INTERESTED") === "INTERESTED",
  "interested outcome maps to interested status",
);
assert(
  outreachStatusForOutcome("NO_RESPONSE") === null,
  "no response keeps sent status",
);

assert(
  mergeProspectOutreachStatus("SENT", "REPLIED") === "REPLIED",
  "replied upgrades sent",
);
assert(
  mergeProspectOutreachStatus("INTERESTED", "REPLIED") === "INTERESTED",
  "interested is not downgraded by replied",
);
assert(
  mergeProspectOutreachStatus("REPLIED", "CONVERTED") === "CONVERTED",
  "converted wins",
);

assert(
  canConvertProspect({
    outreachStatus: "INTERESTED",
    leadId: null,
    hasSentMessage: true,
    latestOutcome: "INTERESTED",
  }),
  "interested sent prospect can convert",
);
assert(
  !canConvertProspect({
    outreachStatus: "SENT",
    leadId: null,
    hasSentMessage: true,
    latestOutcome: null,
  }),
  "sent without reply cannot convert yet",
);
assert(
  !canConvertProspect({
    outreachStatus: "CONVERTED",
    leadId: "lead-1",
    hasSentMessage: true,
    latestOutcome: "INTERESTED",
  }),
  "converted prospect cannot convert again",
);

const notesLimit = MAX_OUTREACH_OUTCOME_NOTES_CHARS;
assert(notesLimit === 2_000, "notes are bounded");

const here = dirname(fileURLToPath(import.meta.url));
const outcomeActions = readFileSync(
  join(here, "../../../app/reports/prospecting/outcome-actions.ts"),
  "utf8",
);
const conversionActions = readFileSync(
  join(here, "../../../app/reports/prospecting/conversion-actions.ts"),
  "utf8",
);
const prospectPage = readFileSync(
  join(
    here,
    "../../../app/reports/prospecting/[campaignId]/prospects/[prospectId]/page.tsx",
  ),
  "utf8",
);

assert(
  outcomeActions.includes("recordOutreachOutcome"),
  "record outcome action exists",
);
assert(
  outcomeActions.includes("outreachOutcome.create"),
  "outcome history is preserved as events",
);
assert(
  outcomeActions.includes('status !== "SENT"'),
  "outcome recording verifies sent message remains sent",
);
assert(
  outcomeActions.includes("getInternalSession"),
  "outcome recording requires session",
);
assert(
  conversionActions.includes("convertProspectingProspectToLead"),
  "conversion action exists",
);
assert(
  conversionActions.includes("findExistingLeadByHostname"),
  "duplicate lead detection exists",
);
assert(
  conversionActions.includes("leadActivity.create"),
  "conversion creates lead activity",
);
assert(
  conversionActions.includes('outreachStatus: "CONVERTED"'),
  "conversion marks prospect converted",
);
assert(
  prospectPage.includes("OutreachOutcomePanel"),
  "prospect page exposes record outcome UI",
);
assert(
  prospectPage.includes("ProspectLeadConversionPanel"),
  "prospect page exposes conversion UI",
);

console.log("outcome.verify.ts passed");

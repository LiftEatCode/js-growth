import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSuppressionTargets,
  suppressionReasonForBounce,
  suppressionReasonForConversion,
  suppressionReasonForNotInterested,
} from "./apply";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const optOutTargets = buildSuppressionTargets({
  hostname: "Business.com",
  email: "Owner@Business.com",
  reason: suppressionReasonForNotInterested({
    explicitOptOut: true,
    suppressFutureOutreach: true,
  })!,
  suppressHostname: true,
  suppressEmail: true,
});
assert(optOutTargets.length === 2, "explicit opt-out suppresses hostname and email");
assert(
  optOutTargets.some(
    (target) => target.type === "HOSTNAME" && target.reason === "OPTED_OUT",
  ),
  "explicit opt-out uses OPTED_OUT reason",
);

const bounceTargets = buildSuppressionTargets({
  hostname: "business.com",
  email: "bad@business.com",
  reason: suppressionReasonForBounce(),
  suppressHostname: false,
  suppressEmail: true,
});
assert(bounceTargets.length === 1, "bounce suppresses only the email");
assert(bounceTargets[0]?.reason === "BOUNCED", "bounce reason is explicit");

const convertedTargets = buildSuppressionTargets({
  hostname: "business.com",
  email: null,
  reason: suppressionReasonForConversion(),
  suppressHostname: true,
  suppressEmail: false,
});
assert(convertedTargets.length === 1, "conversion suppresses hostname only");
assert(convertedTargets[0]?.reason === "CONVERTED", "conversion reason is explicit");

const here = dirname(fileURLToPath(import.meta.url));
const outcomeActions = readFileSync(
  join(here, "../../../app/reports/prospecting/outcome-actions.ts"),
  "utf8",
);

assert(
  outcomeActions.includes("suppressionEntry.create"),
  "outcome actions can create suppression entries",
);
assert(
  outcomeActions.includes('status: "SUPPRESSED"'),
  "bounce marks contact suppressed",
);

console.log("suppression-apply.verify.ts passed");

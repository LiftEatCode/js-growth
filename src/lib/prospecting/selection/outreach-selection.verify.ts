import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  campaignProspectEffectiveOutreachWhere,
  canToggleManualOutreachSelection,
  isProspectEligibleForOutreachWorkflow,
  isProspectSelectedForOutreach,
  outreachSelectionKind,
  outreachSelectionLabel,
} from "./outreach-selection";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  isProspectSelectedForOutreach({
    isSelectedTopN: true,
    isSelectedForOutreach: false,
  }),
  "Top N prospect is effectively selected",
);

assert(
  isProspectSelectedForOutreach({
    isSelectedTopN: false,
    isSelectedForOutreach: true,
  }),
  "manual non-Top-N prospect is effectively selected",
);

assert(
  !isProspectSelectedForOutreach({
    isSelectedTopN: false,
    isSelectedForOutreach: false,
  }),
  "unselected prospect is not effectively selected",
);

assert(
  outreachSelectionKind({
    isSelectedTopN: false,
    isSelectedForOutreach: true,
  }) === "MANUAL",
  "J-Tech-like manual selection label kind",
);

assert(
  outreachSelectionLabel("MANUAL") === "Selected manually",
  "manual selection label text",
);

assert(
  outreachSelectionKind({
    isSelectedTopN: true,
    isSelectedForOutreach: false,
  }) === "TOP_N",
  "Top N only kind",
);

assert(
  outreachSelectionKind({
    isSelectedTopN: true,
    isSelectedForOutreach: true,
  }) === "TOP_N_AND_MANUAL",
  "both flags kind",
);

assert(
  !isProspectEligibleForOutreachWorkflow({
    membership: {
      isSelectedTopN: false,
      isSelectedForOutreach: true,
    },
    qualificationStatus: "SKIPPED",
  }),
  "manual selection cannot qualify a skipped prospect",
);

assert(
  isProspectEligibleForOutreachWorkflow({
    membership: {
      isSelectedTopN: false,
      isSelectedForOutreach: true,
    },
    qualificationStatus: "QUALIFIED",
  }),
  "manual qualified prospect is workflow eligible",
);

assert(
  isProspectEligibleForOutreachWorkflow({
    membership: {
      isSelectedTopN: true,
      isSelectedForOutreach: false,
    },
    qualificationStatus: "QUALIFIED",
  }),
  "Top N remains eligible when manual flag is false",
);

const where = campaignProspectEffectiveOutreachWhere();
assert(Array.isArray(where.OR) && where.OR.length === 2, "effective where uses OR");

assert(
  !canToggleManualOutreachSelection({ qualificationStatus: "SKIPPED" }).allowed,
  "cannot toggle manual selection for skipped prospect",
);

assert(
  canToggleManualOutreachSelection({ qualificationStatus: "QUALIFIED" }).allowed,
  "qualified prospect can toggle manual selection",
);

const qualificationActions = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../app/reports/prospecting/qualification-actions.ts",
  ),
  "utf8",
);

assert(
  qualificationActions.includes("isSelectedTopN: row.isSelectedTopN"),
  "Top N recalculation updates algorithm flag",
);
assert(
  !qualificationActions.includes("isSelectedForOutreach"),
  "Top N recalculation does not erase manual selection",
);

console.log("outreach-selection.verify.ts passed");

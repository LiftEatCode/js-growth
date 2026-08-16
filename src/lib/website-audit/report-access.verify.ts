import { resolveReportTier } from "./report-access";
import { getAuditTierComparison, getReportCapabilities } from "./report-config";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const unpaidPublic = resolveReportTier({
  mode: "public",
  professionallyUnlocked: false,
});
assert(unpaidPublic === "free", "unpaid public reports stay free");
assert(
  getReportCapabilities(unpaidPublic).showUpgradeCta === true,
  "free reports show upgrade",
);
assert(
  getReportCapabilities(unpaidPublic).showActionPlan === false,
  "free reports hide action plan",
);

const paidPublic = resolveReportTier({
  mode: "public",
  professionallyUnlocked: true,
});
assert(paidPublic === "professional", "paid public reports become professional");
assert(
  getReportCapabilities(paidPublic).showUpgradeCta === false,
  "paid reports hide unlock CTA",
);
assert(
  getReportCapabilities(paidPublic).showActionPlan === true,
  "paid reports show action plan",
);

const consultation = resolveReportTier({
  mode: "consultation",
  professionallyUnlocked: false,
});
assert(consultation === "professional", "consultation remains professional without payment");

const client = resolveReportTier({
  mode: "client",
  professionallyUnlocked: false,
});
assert(client === "professional", "client remains professional without payment");

const comparison = getAuditTierComparison();
assert(
  comparison.some(
    (row) =>
      row.feature === "30–90 day action plan" &&
      row.free === "Not included" &&
      row.professional === "Included",
  ),
  "comparison reflects action plan capabilities",
);
assert(
  comparison.some(
    (row) =>
      row.feature === "Executive growth analysis" &&
      row.free === "Not included" &&
      row.professional === "Included",
  ),
  "comparison reflects AI interpretation capability",
);

console.log("report access verification passed");
process.exit(0);

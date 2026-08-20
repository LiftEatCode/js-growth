import { normalizeBusinessVerticals } from "./normalize";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const hvac = normalizeBusinessVerticals([
  { source: "business_name", text: "High Point A/C & Heating" },
  { source: "places_type", text: "general_contractor" },
  { source: "places_display", text: "General contractor" },
]);
assert(hvac.verticals.includes("HVAC"), "HVAC name maps to HVAC");
assert(
  !hvac.verticals.includes("HOME_SERVICES") || hvac.verticals.includes("HVAC"),
  "generic contractor does not override HVAC",
);

const plumbing = normalizeBusinessVerticals([
  { source: "industry", text: "plumbing" },
  { source: "campaign", text: "Plumber" },
]);
assert(plumbing.verticals.includes("PLUMBING"), "plumbing industry maps");

const electrical = normalizeBusinessVerticals([
  { source: "business_name", text: "Roa Electrical Services" },
  { source: "places_type", text: "electrician" },
]);
assert(electrical.verticals.includes("ELECTRICAL"), "electrical maps");

const roofing = normalizeBusinessVerticals([
  { source: "campaign", text: "roofing" },
]);
assert(roofing.verticals.includes("ROOFING"), "roofing maps");

const landscaping = normalizeBusinessVerticals([
  { source: "places_type", text: "landscaper" },
]);
assert(landscaping.verticals.includes("LANDSCAPING"), "landscaping maps");

const multi = normalizeBusinessVerticals([
  {
    source: "business_name",
    text: "Bradbury Brothers HVAC Plumbing Electrical",
  },
]);
assert(multi.verticals.includes("HVAC"), "multi-vertical includes HVAC");
assert(multi.verticals.includes("PLUMBING"), "multi-vertical includes plumbing");
assert(
  multi.verticals.includes("ELECTRICAL"),
  "multi-vertical includes electrical",
);

const generic = normalizeBusinessVerticals([
  { source: "places_type", text: "general_contractor" },
  { source: "places_display", text: "Services" },
]);
assert(
  generic.verticals.includes("CONSTRUCTION") ||
    generic.verticals.includes("HOME_SERVICES"),
  "generic contractor maps weakly",
);
assert(!generic.verticals.includes("HVAC"), "generic contractor is not HVAC");

console.log("verticals.verify.ts passed");

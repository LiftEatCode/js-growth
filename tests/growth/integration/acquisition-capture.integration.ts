/**
 * Growth acquisition capture — non-browser integration checks.
 * No live external APIs.
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import {
  ACQUISITION_CAPTURE_VERSION,
  channelFromAcquisition,
  buildAcquisitionContext,
  normalizeAcquisitionForPersistence,
  GBP_WEBSITE_UTM,
} from "@/lib/growth/acquisition-capture";
import { FACEBOOK_PAGE_UTM } from "@/lib/growth/utm";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(ACQUISITION_CAPTURE_VERSION === 1, "version");

const fb = buildAcquisitionContext({
  ...FACEBOOK_PAGE_UTM,
  content: "company_integration",
  landingPath: "/website-audit",
  entryType: "UTM",
});
assert(fb, "fb context");
assert(channelFromAcquisition(fb) === "FACEBOOK", "facebook channel");

const gbp = buildAcquisitionContext({
  ...GBP_WEBSITE_UTM,
  landingPath: "/",
  entryType: "UTM",
});
assert(gbp, "gbp context");
assert(channelFromAcquisition(gbp) === "GBP", "gbp channel");

const leaked = normalizeAcquisitionForPersistence({
  ...fb,
  email: "nope@example.com",
  reportId: "secret",
});
assert(leaked && !("email" in leaked) && !("reportId" in leaked), "no pii keys");

if (process.env.STRIPE_SECRET_KEY?.includes("sk_live_")) {
  throw new Error("LIVE stripe key in growth integration env");
}

console.log("growth acquisition integration PASS");
